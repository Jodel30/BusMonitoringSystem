using Microsoft.AspNetCore.Mvc;
using MonitoringSystem.Models;
using QRCoder; // Requires QRCoder NuGet Package

namespace MonitoringSystem.Controllers
{
    public class SchoolDashboard : Controller
    {
        // For Capstone Prototype: Use a static list to store students in memory
        private static List<Student> _studentList = new List<Student>();

        public IActionResult SchoolAdmin()
        {
            // Pass the list to the View so it can be displayed in the table
            return View(_studentList);
        }

        [HttpPost]
        public IActionResult RegisterStudent(Student model, IFormFile studentPhoto)
        {
            // 1. Handle Photo Upload
            if (studentPhoto != null)
            {
                string folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
                if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);

                string fileName = Guid.NewGuid().ToString() + "_" + studentPhoto.FileName;
                string filePath = Path.Combine(folder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    studentPhoto.CopyTo(stream);
                }
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


            // 3. Add to our "Database"
            _studentList.Add(model);

            // 4. Refresh the page
            return Redirect(Url.Action("SchoolAdmin") + "#students");
        }
        [HttpGet]
        public IActionResult GetStudentData(string lrn)
        {
            // Search our static list for the student with this LRN
            var student = _studentList.FirstOrDefault(s => s.LRN == lrn);

            if (student != null)
            {
                return Json(new
                {
                    success = true,
                    name = $"{student.FirstName} {student.LastName}",
                    photo = student.PhotoPath, // Path to the uploaded image
                    level = student.GradeLevel
                });
            }

            return Json(new { success = false, message = "Student not found" });
        }
    }
}
