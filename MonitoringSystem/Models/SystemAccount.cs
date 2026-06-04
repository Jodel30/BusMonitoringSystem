namespace MonitoringSystem.Models
{
    public class SystemAccount
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string MiddleName { get; set; }
        public string Username { get; set; }
        public string Role { get; set; } 
        public string Password { get; set; }
        // Specific fields
        public string Address { get; set; }
        public string ContactNo { get; set; }
        public string Email { get; set; }
        public string SchoolId { get; set; }

        public string FullName => $"{FirstName} {LastName}";
    }
}
