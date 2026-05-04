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
                
                TripLogs = DriverDashboard._tripHistory
            };

            // 2. Pass the ViewModel to the View
            return View(viewModel);
        }

        [HttpPost]
        public IActionResult RegisterStudent(Student model, IFormFile studentPhoto)
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

           
            string combinedName = $"{model.FirstName} {model.MiddleName} {model.LastName}";
            string qrText = $"STMS-DATA|LRN:{model.LRN}|Name:{combinedName}|Level:{model.GradeLevel}";
            using (QRCodeGenerator qrGenerator = new QRCodeGenerator())
            using (QRCodeData qrCodeData = qrGenerator.CreateQrCode(qrText, QRCodeGenerator.ECCLevel.Q))
            using (PngByteQRCode qrCode = new PngByteQRCode(qrCodeData))
            {
                byte[] qrCodeImage = qrCode.GetGraphic(20);
                model.QRCodeBase64 = Convert.ToBase64String(qrCodeImage);
            }

            _studentList.Add(model);
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
                
                return Json(new
                {
                    success = true,
                    name = $"{student.FirstName} {student.LastName}",
                    photo = student.PhotoPath,
                    level = student.GradeLevel,
                    section = student.Section,  
                    address = student.Address,    
                    status = "Boarded"           // Default status for successful scan
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
    }
}