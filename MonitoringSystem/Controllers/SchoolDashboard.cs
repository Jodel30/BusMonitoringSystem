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
            if (string.IsNullOrEmpty(lrn)) return Json(new { success = false, message = "Scan data empty." });

            string input = lrn.Trim().Replace(" ", "+");
            string targetLrn = "";
            Models.QRCode qrPass = null;

            // 1. CHECK THE QRCODE TABLE (Search by Value 'LS-2026-XXXX')
            qrPass = _context.QRCodes.FirstOrDefault(q => q.QRCodeValue == input);

            if (qrPass != null)
            {
                // In your ERD, QR table links to Student. Assuming you have StudentLRN in QR table:
                // If not, we search Students table by QRCodeID
                var studentByQR = _context.Students.FirstOrDefault(s => s.QRCodeID == qrPass.QRCodeID);
                if (studentByQR != null) targetLrn = studentByQR.StudentLRN;
            }
            else
            {
                // Fallback for manual search (Driver typing LRN or School ID)
                var manual = _context.Students.FirstOrDefault(s => s.StudentLRN == input || s.StudentSchoolID.ToString() == input);
                if (manual != null) targetLrn = manual.StudentLRN;
            }

            // 2. FETCH PROFILE
            var student = _context.Students.FirstOrDefault(s => s.StudentLRN == targetLrn);

            if (student != null)
            {
                if (student.Status == "Inactive") return Json(new { success = false, message = "Student is Inactive." });

                // FIXED: Table name is 'TransportActivities'
                var history = _context.TransportActivities
                    .Where(h => h.StudentID == student.StudentID)
                    .OrderByDescending(h => h.Time)
                    .ToList();

                return Json(new
                {
                    success = true,
                    name = student.FullName,
                    photo = student.PhotoPath,
                    level = student.GradeLevel,
                    section = student.Section,
                    address = student.Address,
                    id = student.StudentSchoolID,
                    systemPassId = qrPass?.QRCodeValue ?? "Manual",
                    parent = student.ParentGuardianName,
                    contact = student.ContactNum,
                    tripHistory = history,
                    totalTrips = history.Count
                });
            }

            return Json(new { success = false, message = "Invalid Pass." });
        }

        [HttpGet]
        public IActionResult GetTripManifest(int tripId) // Changed to int to match ERD TripID
        {
            // FIXED: Table name is 'TransportActivities'
            var scans = _context.TransportActivities.Where(s => s.TripID == tripId).ToList();

            var manifest = scans.Select(scan => {
                var student = _context.Students.FirstOrDefault(s => s.StudentID == scan.StudentID);
                return new
                {
                    name = student != null ? student.FullName : "Unknown",
                    level = student?.GradeLevel ?? "N/A",
                    section = student?.Section ?? "N/A",
                    address = student?.Address ?? "N/A",
                    time = scan.Time.ToString(@"hh\:mm"),
                    status = scan.EntryMethod
                };
            }).ToList();

            return Json(new { success = true, students = manifest });
        }

        [HttpPost]
        public IActionResult UpdateStudent(Student updatedData)
        {
            // DEBUG: Look at your "Output" window in Visual Studio to see these
            System.Diagnostics.Debug.WriteLine("Updating Student ID: " + updatedData.StudentID);
            System.Diagnostics.Debug.WriteLine("New Status: " + updatedData.Status);

            // Try to find the student
            var student = _context.Students.FirstOrDefault(s => s.StudentID == updatedData.StudentID);

            if (student != null)
            {
                student.FirstName = updatedData.FirstName;
                student.MiddleName = updatedData.MiddleName;
                student.LastName = updatedData.LastName;
                student.GradeLevel = updatedData.GradeLevel;
                student.Section = updatedData.Section;
                student.ContactNum = updatedData.ContactNum;

                // FORCE the update
                student.Status = updatedData.Status;

                _context.SaveChanges();
                TempData["Message"] = "Save Successful";
            }
            else
            {
                // IF THIS RUNS, your HTML ID is wrong
                TempData["Message"] = "Error: Student Not Found in Database";
            }

            string anchor = (updatedData.Status == "Inactive") ? "#archive" : "#students";
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

        // ... Resolve methods updated to use _context.Students and _context.SaveChanges() ...
    }
}