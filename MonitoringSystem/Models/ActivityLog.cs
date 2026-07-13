using System.ComponentModel.DataAnnotations;

namespace MonitoringSystem.Models
{
    public class ActivityLog
    {
        [Key]
        public int ActivityID { get; set; }
        public int UserID { get; set; }// Foreign Key
        public string Role { get; set; }
        public string Action { get; set; }
        public DateTime LogDate { get; set; }
        public TimeSpan LogTime { get; set; }
        public string User { get; set; } 
    }
}
