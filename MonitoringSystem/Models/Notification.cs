using System.ComponentModel.DataAnnotations;

namespace MonitoringSystem.Models
{
    public class Notification
    {
        [Key]
        public int NotificationID { get; set; }
        public int StudentID { get; set; } // Foreign Key
        public string NotificationType { get; set; }
        public DateTime Date { get; set; }
        public bool isRead { get; set; } = false;
    }
}
