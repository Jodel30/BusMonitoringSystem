namespace MonitoringSystem.Models
{
    public class LguDashboardViewModel
    {
        public List<Student> Students { get; set; }
        public List<Trip> TripLogs { get; set; }
        public List<SystemAccount> Accounts { get; set; }
        public List<ActivityLog> ActivityLogs { get; internal set; }

        public List<string> LowUsageStudentLRNs { get; set; } = new List<string>();
    }
}
