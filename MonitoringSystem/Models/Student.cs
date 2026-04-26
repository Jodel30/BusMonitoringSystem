using System.ComponentModel.DataAnnotations;

namespace MonitoringSystem.Models
{
    public class Student
    {
        [Key]
        public string LRN { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public string GradeLevel { get; set; }
        public string Section { get; set; }
        public string StudentId { get; set; }
        public string Address { get; set; }
        public string PhotoPath { get; set; }
        public string QRCodeBase64 { get; set; }

       
        public string FullName => $"{FirstName} {MiddleName} {LastName}";
    }
}
