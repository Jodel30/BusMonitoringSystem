using MonitoringSystem.Controllers;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; // ADD THIS for [NotMapped]

namespace MonitoringSystem.Models
{
    public class Student
    {
        [Key]
        public int StudentID { get; set; }
        public int QRCodeID { get; set; }
        public string StudentLRN { get; set; }
        public string FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string LastName { get; set; }
        public string GradeLevel { get; set; }
        public string Section { get; set; }
        public string StudentSchoolID { get; set; }
        public string Address { get; set; }
        public string? PhotoPath { get; set; }
        public string? QRCodeBase64 { get; set; }
        public string ParentGuardianName { get; set; }
        public string ContactNum { get; set; }

        [DataType(DataType.Date)]
        public DateTime DateRegistered { get; set; }

        public string Status { get; set; } = "Active";
        public string FullName => $"{FirstName} {MiddleName} {LastName}";
        public int ManualCheckInCount { get; set; } = 0;
        public bool ManualAlertResolved { get; set; } = false;
        public string ReviewStatus { get; set; } = "Healthy";
        public string? LastBoardingDate { get; set; }
        public bool AbsenceAlertResolved { get; set; } = false;
        public bool LowUsageAlertResolved { get; set; } = false;

        // --- 1. GRADE LEVEL UPDATE LOGIC ---
        public bool NeedsUpdate
        {
            get
            {
                bool isOverYear = (DateTime.Now - DateRegistered).TotalDays >= 365;
                return isOverYear && ReviewStatus == "Pending" && Status == "Active";
            }
            }
        

        // --- 2. QR REPLACEMENT LOGIC ---
        public bool NeedsNewQR => ManualCheckInCount >= 2 && !ManualAlertResolved;

        // --- 3. ABSENCE LOGIC ---
        public bool IsLongAbsence
        {
            get
            {
                if (DateTime.TryParse(LastBoardingDate, out DateTime lastSeen))
                {
                    return (DateTime.Now - lastSeen).TotalDays >= 30 && !AbsenceAlertResolved && Status == "Active";
                }
                if (DateTime.TryParse(DateRegistered.ToString(), out DateTime regDate))
                {
                    return (DateTime.Now - regDate).TotalDays >= 30 && string.IsNullOrEmpty(LastBoardingDate) && !AbsenceAlertResolved && Status == "Active";
                }
                return false;
            }
        }

        // --- 4. THE FIX: LOW USAGE PROPERTIES ---
        // We mark these as [NotMapped] so they don't break the database
        // The Controller will fill these values every time the page loads
        [NotMapped]
        public bool IsLowUsage { get; set; } = false;

        [NotMapped]
        public int WeeklyTripCount { get; set; } = 0;
    }
}