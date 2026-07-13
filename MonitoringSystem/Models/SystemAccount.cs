using System.ComponentModel.DataAnnotations;

namespace MonitoringSystem.Models
{
    public class SystemAccount
    {
        [Key]
        public int UserID { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string Role { get; set; }
        public string? ContactNum { get; set; }
        public bool isActive { get; set; } = true;
        public string FullName => $"{FirstName} {LastName}";
        // Specific fields
        public string? Address { get; set; }
        public string? Email { get; set; }
        public string? SchoolId { get; set; }
    }
}
