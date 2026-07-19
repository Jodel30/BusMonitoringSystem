using Microsoft.AspNetCore.Mvc;
using MonitoringSystem.Data;
using MonitoringSystem.Helpers;
using MonitoringSystem.Models;
using QRCoder;
using System;
using System.Linq;

namespace MonitoringSystem.Controllers
{
    public class SchoolDashboard : Controller
    {
        private readonly ApplicationDbContext _context;

        public SchoolDashboard(ApplicationDbContext context)
        {
            _context = context;
        }

        public IActionResult SchoolAdmin()
        {
            var viewModel = new SchoolAdminViewModel
            {
                // FIXED: Use StudentID (int) for sorting
                Students = _context.Students.OrderByDescending(s => s.StudentID).ToList(),

                // FIXED: Table name is now 'Trips'
                TripLogs = _context.Trips.OrderByDescending(t => t.TripID).ToList(),

                UpdateCount = _context.Students.AsEnumerable().Count(s => s.NeedsUpdate)
            };

            return View(viewModel);
        }

        [HttpPost]
        public IActionResult RegisterStudent(Student model, IFormFile studentPhoto, string OtherAddressDetail)
        {
            // 1. Photo Logic
            if (studentPhoto != null)
            {
                string folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
                if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);
                string fileName = Guid.NewGuid().ToString() + "_" + studentPhoto.FileName;
                string filePath = Path.Combine(folder, fileName);
                using (var stream = new FileStream(filePath, FileMode.Create)) { studentPhoto.CopyTo(stream); }
                model.PhotoPath = "/uploads/" + fileName;
            }

            if (model.Address == "Others" && !string.IsNullOrEmpty(OtherAddressDetail))
            {
                model.Address = $"Others ({OtherAddressDetail})";
            }

            // 2. CREATE QR CODE RECORD (Matches your ERD mapping)
            int nextSequence = _context.QRCodes.Count() + 101;
            string generatedValue = $"LS-2026-{nextSequence.ToString().PadLeft(4, '0')}";

            var qrRecord = new Models.QRCode
            {
                QRCodeValue = generatedValue,
                // If your model has these fields, keep them:
                // StudentLRN = model.StudentLRN,
                // IsActive = true
            };

            _context.QRCodes.Add(qrRecord);
            _context.SaveChanges(); // Generate numeric QRCodeID

            // 3. LINK TO STUDENT
            model.QRCodeID = qrRecord.QRCodeID;
            model.DateRegistered = DateTime.Now;
            model.Status = "Active";

            // 4. GENERATE IMAGE
            using (QRCodeGenerator qrGenerator = new QRCodeGenerator())
            using (QRCodeData qrCodeData = qrGenerator.CreateQrCode(generatedValue, QRCodeGenerator.ECCLevel.Q))
            using (PngByteQRCode qrCode = new PngByteQRCode(qrCodeData))
            {
                byte[] qrCodeImage = qrCode.GetGraphic(20);
                model.QRCodeBase64 = Convert.ToBase64String(qrCodeImage);
            }

            _context.Students.Add(model);
            _context.SaveChanges();

            TempData["RegistrationSuccess"] = true;
            return Redirect(Url.Action("SchoolAdmin") + "#students");
        }

        [HttpGet]
        public IActionResult GetStudentData(string lrn)
        {
            try
            {
                if (string.IsNullOrEmpty(lrn)) return Json(new { success = false, message = "Scan data empty." });

                // Clean the input
                string input = lrn.Trim();
                string targetLrn = "";
                Models.QRCode qrPass = null;

                // 1. CHECK THE QRCODE TABLE
                qrPass = _context.QRCodes.FirstOrDefault(q => q.QRCodeValue == input);

                if (qrPass != null)
                {
                    var studentByQR = _context.Students.FirstOrDefault(s => s.QRCodeID == qrPass.QRCodeID);
                    if (studentByQR != null) targetLrn = studentByQR.StudentLRN;
                }
                else
                {
                    // Fallback for manual search (Checks LRN or School ID)
                    var manual = _context.Students.FirstOrDefault(s => s.StudentLRN == input || s.StudentSchoolID.ToString() == input);
                    if (manual != null) targetLrn = manual.StudentLRN;
                }

                // 2. FETCH PROFILE
                var student = _context.Students.FirstOrDefault(s => s.StudentLRN == targetLrn);

                if (student != null)
                {
                    if (student.Status == "Inactive") return Json(new { success = false, message = "Student is Inactive." });

                    // 3. FETCH HISTORY SAFELY
                    var history = _context.TransportActivities
                        .Where(h => h.StudentID == student.StudentID)
                        .ToList(); // Pull to memory to handle formatting safely

                    var formattedHistory = history.Select(h => new {
                        date = DateTime.Now.ToString("MM/dd/yyyy"),
                        tripId = h.TripID.ToString(),
                        // FIXED: Handle TimeSpan nulls and convert to 12-hour format (AM/PM)
                        scanTime = h.Time != null ? DateTime.Today.Add(h.Time).ToString("hh:mm tt") : "N/A",
                        status = h.EntryMethod ?? "Tap-In"
                    }).OrderByDescending(x => x.scanTime).ToList();

                    return Json(new
                    {
                        success = true,
                        // SAFETY: Use FirstName + LastName if FullName is not a database column
                        name = student.FirstName + " " + student.LastName,
                        photo = student.PhotoPath ?? "/lib/default-avatar.png",
                        level = student.GradeLevel ?? "N/A",
                        section = student.Section ?? "N/A",
                        address = student.Address ?? "N/A",
                        id = student.StudentSchoolID,
                        systemPassId = qrPass?.QRCodeValue ?? "Manual",
                        parent = student.ParentGuardianName ?? "N/A",
                        contact = student.ContactNum ?? "N/A",
                        regDate = student.DateRegistered.ToString("MM/dd/yyyy"),
                        tripHistory = formattedHistory,
                        totalTrips = history.Count,
                        manualCount = history.Count(h => h.EntryMethod == "Manual")
                    });
                }

                return Json(new { success = false, message = "Student record not found." });
            }
            catch (Exception ex)
            {
                // THIS IS THE KEY: If it fails, the "Failed to load data" will be replaced 
                // by the actual error message from C# so you can see it.
                return Json(new { success = false, message = "Server Error: " + ex.Message });
            }
        }
        [HttpGet]
        public IActionResult GetTripManifest(int tripId)
        {
            // 1. Fetch scans from TransportActivities
            var scans = _context.TransportActivities.Where(s => s.TripID == tripId).ToList();

            var manifest = scans.Select(scan => {
                var student = _context.Students.FirstOrDefault(s => s.StudentID == scan.StudentID);

                // --- THE FIX: Convert TimeSpan to 12-hour format with AM/PM ---
                // We add the TimeSpan to Today's date so we can use "hh:mm tt"
                string normalTime = DateTime.Today.Add(scan.Time).ToString("hh:mm tt");

                return new
                {
                    name = student != null ? student.FullName : "Unknown",
                    level = student?.GradeLevel ?? "N/A",
                    section = student?.Section ?? "N/A",
                    address = student?.Address ?? "N/A",
                    time = normalTime, // Now returns "07:16 PM"
                    status = scan.EntryMethod ?? "QR"
                };
            }).ToList();

            return Json(new { success = true, students = manifest });
        }

        [HttpPost]
        public IActionResult UpdateStudent(int id, string status, string firstName, string middleName, string lastName, string gradeLevel, string section, string contact)
        {
            // Try to find the student
            var student = _context.Students.FirstOrDefault(s => s.StudentID == id);

            if (student != null)
            {
                student.FirstName = firstName;
                student.MiddleName = middleName;
                student.LastName = lastName;
                student.GradeLevel = gradeLevel;
                student.Section = section;
                student.ContactNum = contact;
                student.Status = status;

                _context.SaveChanges();
                TempData["UpdateStatus"] = "Success";
            }
            else
            {
                // THIS IS THE KEY: If you see this message, the ID passed from JS is wrong
                TempData["UpdateStatus"] = "Error: Student ID " + id + " not found in database.";
            }

            string anchor = (status == "Inactive") ? "#archive" : "#students";
            return Redirect(Url.Action("SchoolAdmin") + anchor);
        }
        [HttpPost]
        public IActionResult DeleteStudent(int studentId)
        {
            var student = _context.Students.FirstOrDefault(s => s.StudentID == studentId);
            if (student != null)
            {
                _context.Students.Remove(student);
                _context.SaveChanges();
            }
            return Redirect(Url.Action("SchoolAdmin") + "#archive");
        }

        [HttpPost]
        public IActionResult MarkAsActive(int studentId)
        {
            // Search for the student by their Primary Key
            var student = _context.Students.FirstOrDefault(s => s.StudentID == studentId);

            if (student != null)
            {
                student.Status = "Active"; // Set them back to Active
                _context.SaveChanges();
                return Ok(); // Return 200 OK so the JavaScript knows to reload
            }

            return NotFound(); // Return 404 if student not found
        }

    }
}