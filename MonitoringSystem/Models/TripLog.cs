namespace MonitoringSystem.Models
{
    public class TripLog
    {
        public string TripId { get; set; }
        public string Date { get; set; }
        public string StartTime { get; set; }
        public string EndTime { get; set; }
        public int BoardedCount { get; set; }
        public string DriverName { get; set; }
        public string Shift { get; set; }
    }
}
