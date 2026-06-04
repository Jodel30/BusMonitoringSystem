using Microsoft.AspNetCore.Mvc;
using MonitoringSystem.Models;
using QRCoder;

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

            
            string combinedName = $"{model.FirstName} {model.MiddleName} {model.LastName}";

           
            string qrText = $"STMS-DATA|LRN:{model.LRN}|Name:{combinedName}|Level:{model.GradeLevel}";
            using (QRCodeGenerator qrGenerator = new QRCodeGenerator())
            using (QRCodeData qrCodeData = qrGenerator.CreateQrCode(qrText, QRCodeGenerator.ECCLevel.Q))
            using (PngByteQRCode qrCode = new PngByteQRCode(qrCodeData))
            {
                byte[] qrCodeImage = qrCode.GetGraphic(20);
                model.QRCodeBase64 = Convert.ToBase64String(qrCodeImage);
            }

            
            model.DateRegistered = DateTime.Now.ToString("MMM dd, yyyy");

            _studentList.Add(model);
            TempData["RegistrationSuccess"] = true;

            return Redirect(Url.Action("SchoolAdmin") + "#students");
        }
        [HttpGet]
        public IActionResult GetStudentData(string lrn)
        {
            string cleanLrn = lrn?.Trim();
            if (!string.IsNullOrEmpty(cleanLrn) && cleanLrn.Contains("LRN:"))
            {
                cleanLrn = cleanLrn.Split("LRN:")[1].Split("|")[0].Trim();
            }

            var student = _studentList.FirstOrDefault(s => s.LRN == cleanLrn);

            if (student != null)
            {
                // --- SECURITY CHECK ---
                if (student.Status == "Inactive")
                {
                    return Json(new
                    {
                        success = false,
                        message = "Access Denied: This student is currently inactive/archived and is not authorized to board."
                    });
                }

                // 1. Fetch only this student's scans
                var history = _scanHistory
                    .Where(h => h.LRN == cleanLrn)
                    .OrderByDescending(h => h.Date)
                    .ThenByDescending(h => h.ScanTime)
                    .ToList();

                // --- NEW: CALCULATE MANUAL COUNT ---
                // We count every record in their history where the status starts with "Manual"
                int manualScans = history.Count(h => h.Status != null && h.Status.Contains("Manual"));

                // 2. Return data including the manual count
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

                    // --- ADDED THIS PROPERTY ---
                    manualCount = manualScans
                });
            }

            return Json(new { success = false, message = "Student record not found." });
        }
        [HttpGet]
        public IActionResult GetTripManifest(string tripId)
        {
            // 1. Get all scans for this specific trip
            var scans = _scanHistory.Where(s => s.TripId == tripId).ToList();

            // 2. Link those scans to the Student details to get names and photos
            var manifest = scans.Select(scan => {
                var student = _studentList.FirstOrDefault(s => s.LRN == scan.LRN);
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