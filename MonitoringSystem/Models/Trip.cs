using System.ComponentModel.DataAnnotations;

namespace MonitoringSystem.Models
{
    public class Trip
    {
        [Key]
        public int TripID { get; set; }
        public int? UserID { get; set; } // Foreign Key
        public string? TripSchedule { get; set; } // AM or PM
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public int TotalBoarded { get; set; }
        public string? Status { get; set; }
        public string? Date { get; set; } // Added for UI helper
        public string? DriverName { get; set; } // Added for UI helper
    }
}
