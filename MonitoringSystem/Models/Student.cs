using MonitoringSystem.Controllers;
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
        public string Parent { get; set; }
        public string ParentContact { get; set; }

        public string DateRegistered { get; set; }
        public string Status { get; set; } = "Active";
        public string FullName => $"{FirstName} {MiddleName} {LastName}";
        public int ManualCheckInCount { get; set; } = 0;
        public bool ManualAlertResolved { get; set; } = false;
        public string ReviewStatus { get; set; } = "Healthy";

        public bool NeedsUpdate
        {
            get
            {
                if (DateTime.TryParse(DateRegistered, out DateTime regDate))
                {
                    // Logic: Over 1 year AND the status is "Pending"
                    bool isOverYear = (DateTime.Now - regDate).TotalDays >= 365;

                    // Matches your new UI status
                    return isOverYear && ReviewStatus == "Pending" && Status == "Active";
                }
                return false;
            }
        }
        public bool NeedsNewQR => ManualCheckInCount >= 2 && !ManualAlertResolved;

        public string LastBoardingDate { get; set; } // Store as string like "MMM dd, yyyy"
        public bool AbsenceAlertResolved { get; set; } = false;

        public bool IsLongAbsence
        {
            get
            {
                if (DateTime.TryParse(LastBoardingDate, out DateTime lastSeen))
                {
                    return (DateTime.Now - lastSeen).TotalDays >= 30 && !AbsenceAlertResolved && Status == "Active";
                }
                // If they registered but NEVER boarded for a month
                if (DateTime.TryParse(DateRegistered, out DateTime regDate))
                {
                    return (DateTime.Now - regDate).TotalDays >= 30 && string.IsNullOrEmpty(LastBoardingDate) && !AbsenceAlertResolved && Status == "Active";
                }
                return false;
            }
        }
        public bool LowUsageAlertResolved { get; set; } = false;

        // Logic: Returns true if the student has boarded 3 or fewer times in the last 7 days
        public bool IsLowUsage
        {
            get
            {
                // 1. Basic checks: Must be Active and not already resolved by Admin
                if (Status != "Active" || LowUsageAlertResolved) return false;

               
                if (DateTime.Now.DayOfWeek != DayOfWeek.Friday) return false;

               
                if (DateTime.TryParse(DateRegistered, out DateTime regDate))
                {
                    if ((DateTime.Now - regDate).TotalDays < 5) return false;
                }

                // 4. Count trips for this student in the last 7 days
                int tripCount = SchoolDashboard._scanHistory.Count(s =>
                    s.LRN == this.LRN &&
                    DateTime.TryParse(s.Date, out DateTime tripDate) &&
                    (DateTime.Now - tripDate).TotalDays <= 7
                );

                // 5. Final Alert: If it's Friday, they've been here a week, and have 3 or fewer trips.
                return tripCount <= 3;
            }
        }
        // Helper to show the actual count in the table
        public int WeeklyTripCount => SchoolDashboard._scanHistory.Count(s =>
            s.LRN == this.LRN &&
            DateTime.TryParse(s.Date, out DateTime tripDate) &&
            (DateTime.Now - tripDate).TotalDays <= 7
        );
    }
}
