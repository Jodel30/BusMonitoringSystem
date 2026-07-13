using System;
using System.ComponentModel.DataAnnotations;

namespace MonitoringSystem.Models
{
    public class QRCode
    {
        [Key]
        public int QRCodeID { get; set; }

        public string? QRCodeValue { get; set; }

        public string? StudentLRN { get; set; } 

        public bool IsActive { get; set; } = true;

        public DateTime DateIssued { get; set; } = DateTime.Now;

        public DateTime? DateDeactivated { get; set; }
    }
}
