using Microsoft.AspNetCore.Mvc;
using MonitoringSystem.Models;
using QRCoder;
using MonitoringSystem.Helpers;

namespace MonitoringSystem.Controllers
{
    public class SchoolDashboard : Controller
    {
        // Static student list
        public static List<Student> _studentList = new List<Student>();



        public static List<StudentScan> _scanHistory = new List<StudentScan>();
           

        public IActionResult SchoolAdmin()
        {
            // 1. Create the ViewModel
            var viewModel = new SchoolAdminViewModel
            {
              
                Students = _studentList,
                
                TripLogs = DriverDashboard._tripHistory,
                UpdateCount = _studentList.Count(s => s.NeedsUpdate)
            };

            // 2. Pass the ViewModel to the View
            return View(viewModel);
        }

        [HttpPost]
        public IActionResult RegisterStudent(Student model, IFormFile studentPhoto, string OtherAddressDetail)
        {
            // 1. Handle Photo Upload
            if (studentPhoto != null)
            {
                string folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
                if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);
                string fileName = Guid.NewGuid().ToString() + "_" + studentPhoto.FileName;
                string filePath = Path.Combine(folder, fileName);
                using (var stream = new FileStream(filePath, FileMode.Create)) { studentPhoto.CopyTo(stream); }
                model.PhotoPath = "/uploads/" + fileName;
            }

            // 2. Handle "Others" Address Logic
            if (model.Address == "Others" && !string.IsNullOrEmpty(OtherAddressDetail))
            {
                model.Address = $"Others ({OtherAddressDetail})";
            }

            // 3. Name Concatenation
            string combinedName = $"{model.FirstName} {model.MiddleName} {model.LastName}";

            // 4. --- THE SECURITY FIX: ENCRYPT DATA ---
            string plainTextData = $"STMS-DATA|LRN:{model.LRN}|Name:{combinedName}|Level:{model.GradeLevel}";
            string encryptedData = SecurityHelper.Encrypt(plainTextData);

            // 5. Generate QR Code using the ENCRYPTED string
            using (QRCodeGenerator qrGenerator = new QRCodeGenerator())
            using (QRCodeData qrCodeData = qrGenerator.CreateQrCode(encryptedData, QRCodeGenerator.ECCLevel.Q))
            using (PngByteQRCode qrCode = new PngByteQRCode(qrCodeData))
            {
                byte[] qrCodeImage = qrCode.GetGraphic(20);
                model.QRCodeBase64 = Convert.ToBase64String(qrCodeImage);
            }

            // 6. Set Metadata
            model.DateRegistered = DateTime.Now.ToString("MMM dd, yyyy");

            _studentList.Add(model);
            TempData["RegistrationSuccess"] = true;

            return Redirect(Url.Action("SchoolAdmin") + "#students");
        }
        [HttpGet]
        public IActionResult GetStudentData(string lrn)
        {
            if (string.IsNullOrEmpty(lrn)) return Json(new { success = false, message = "Scan data is empty." });

            // 1. THE FIX: Restore '+' signs in the encrypted string
            // Browsers often convert '+' to ' ' in URLs. This line fixes that for the Decryptor.
            string inputToProcess = lrn.Trim().Replace(" ", "+");
            string realLrn = lrn.Trim(); // Default fallback to raw input

            // 2. --- THE SECURITY DECRYPTION ---
            try
            {
                // Try to decrypt the scanned text
                string decryptedData = SecurityHelper.Decrypt(inputToProcess);

                // If successful, extract the actual LRN number from the "STMS-DATA|LRN:..." format
                if (decryptedData.Contains("LRN:"))
                {
                    realLrn = decryptedData.Split("LRN:")[1].Split("|")[0].Trim();
                }
            }
            catch
            {
                // If decryption fails, it's either:
                // A. A Manual Boarding click (which sends raw text) -> Use the raw input.
                // B. A Fake QR -> The 'student == null' check below will handle it.
            }

            // 3. Find the student using the verified (decrypted) LRN
            var student = _studentList.FirstOrDefault(s => s.LRN == realLrn);

            if (student != null)
            {
                // --- SECURITY STATUS CHECK ---
                if (student.Status == "Inactive")
                {
                    return Json(new
                    {
                        success = false,
                        message = "Access Denied: This student is currently inactive/archived and is not authorized to board."
                    });
                }

                // 4. Fetch trip history logs for this specific student
                var history = _scanHistory
                    .Where(h => h.LRN == realLrn)
                    .OrderByDescending(h => h.Date)
                    .ThenByDescending(h => h.ScanTime)
                    .ToList();

                // 5. Calculate total Manual Scans
                int manualScans = history.Count(h => h.Status != null && h.Status.Contains("Manual"));

                // 6. Return full data package to the Dashboard
                return Json(new
                {
                    success = true,
                    name = $"{student.FirstName} {student.LastName}",
                    photo = student.PhotoPath,
                    level = student.GradeLevel,
                    section = student.Section,
                    address = student.Address,
                    id = student.StudentId,
                    parent = student.Parent,
                    contact = student.ParentContact,
                    tripHistory = history,
                    totalTrips = history.Count,
                    manualCount = manualScans
                });
            }

            // Final Fallback: Student doesn't exist or encryption was invalid
            return Json(new { success = false, message = "Student record not found in system." });
        }
        [HttpGet]
        public IActionResult GetTripManifest(string tripId)
        {
            // 1. Get all scans for this specific trip
            var scans = _scanHistory.Where(s => s.TripId.Trim() == tripId.Trim()).ToList();

            // 2. Link those scans to the Student details to get names and photos
            var manifest = scans.Select(scan => {
                var student = _studentList.FirstOrDefault(s => s.LRN.Trim() == scan.LRN.Trim());
                return new
                {
                    name = student != null ? $"{student.FirstName} {student.LastName}" : "Unknown",
                    photo = student?.PhotoPath ?? "/lib/default-avatar.png",
                    level = student?.GradeLevel ?? "N/A",
                    section = student?.Section ?? "N/A",
                    address = student?.Address ?? "N/A",
                    time = scan.ScanTime,
                    status = scan.Status
                };
            }).ToList();

            return Json(new { success = true, students = manifest });
        }
        [HttpPost]
        public IActionResult UpdateStudent(Student updatedData)
        {
            // Find the existing student by their unique StudentId
            var student = _studentList.FirstOrDefault(s => s.StudentId == updatedData.StudentId);

            if (student != null)
            {
                student.FirstName = updatedData.FirstName;
                student.MiddleName = updatedData.MiddleName;
                student.LastName = updatedData.LastName;
                student.GradeLevel = updatedData.GradeLevel;
                student.Section = updatedData.Section;
                student.ParentContact = updatedData.ParentContact;
                student.Status = updatedData.Status; // Can be "Active" or "Inactive"

                student.ReviewStatus = "Healthy";

                
                student.DateRegistered = DateTime.Now.ToString("MMM dd, yyyy");
            }

            // Return to the student section
            return Redirect(Url.Action("SchoolAdmin") + "#students");
        }
        [HttpPost]
        public IActionResult DeleteStudent(string studentId)
        {
            // Find the student in the shared list
            var student = _studentList.FirstOrDefault(s => s.StudentId == studentId);

            if (student != null)
            {
                // PERMANENT REMOVAL
                _studentList.Remove(student);

                // Optional: Also remove their boarding history if you want to clear space
                _scanHistory.RemoveAll(h => h.LRN == student.LRN);
            }

            // Redirect back to the archive section
            return Redirect(Url.Action("SchoolAdmin") + "#archive");
        }
        [HttpPost]
        public IActionResult MarkAsPending(string lrn)
        {
            var student = _studentList.FirstOrDefault(s => s.LRN == lrn);
            if (student != null)
            {
                // Change status so it disappears from the "Alerts" list
                student.ReviewStatus = "Pending Update";
                return Json(new { success = true });
            }
            return Json(new { success = false });
        }
        [HttpPost]
        public IActionResult ResolveManualAlert(string lrn)
        {
            var student = _studentList.FirstOrDefault(s => s.LRN.Trim() == lrn.Trim());
            if (student != null)
            {
                // Mark as resolved so it disappears from notifications
                student.ManualAlertResolved = true;
                return Json(new { success = true });
            }
            return Json(new { success = false });
        }

        [HttpPost]
        public IActionResult ResolveAbsenceAlert(string lrn)
        {
            var student = _studentList.FirstOrDefault(s => s.LRN == lrn);
            if (student != null)
            {
                student.AbsenceAlertResolved = true;
                return Json(new { success = true });
            }
            return Json(new { success = false });
        }

        [HttpPost]
        public IActionResult MarkAsActive(string studentId)
        {
            var student = _studentList.FirstOrDefault(s => s.StudentId == studentId);
            if (student != null)
            {
                student.Status = "Active";
            }
            return Ok(); 
        }
    }
}