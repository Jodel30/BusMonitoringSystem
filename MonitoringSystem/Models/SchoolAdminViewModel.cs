namespace MonitoringSystem.Models
{
    public class SchoolAdminViewModel
    {
        public List<Student> Students { get; set; }
        public List<TripLog> TripLogs { get; set; }
        public int UpdateCount { get; internal set; }
    }
}
