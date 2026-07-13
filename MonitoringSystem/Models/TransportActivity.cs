using System.ComponentModel.DataAnnotations;

namespace MonitoringSystem.Models
{
    public class TransportActivity
    {
        [Key]
        public int TransportActivityID { get; set; }
        public int StudentID { get; set; } // Foreign Key
        public int TripID { get; set; }    // Foreign Key
        public string EntryMethod { get; set; } // QR or Manual
        public TimeSpan Time { get; set; }
        public string ManualCheckInReason { get; set; }
    }
}
