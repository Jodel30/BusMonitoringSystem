using Microsoft.AspNetCore.Mvc;
using MonitoringSystem.Models;

namespace MonitoringSystem.Controllers
{
    public class DriverDashboard : Controller
    {
        
        public static List<TripLog> _tripHistory = new List<TripLog>();

        public IActionResult Driver()
        {
            return View(_tripHistory);
        }

        // 1. SAVE THE TRIP SUMMARY (Triggered when "End Trip" is clicked)
        [HttpPost]
        public IActionResult SaveTrip([FromBody] TripLog data)
        {
            if (data != null)
            {
                _tripHistory.Add(data);
                return Json(new { success = true, message = "Trip logged successfully" });
            }
            return Json(new { success = false, message = "Invalid data" });
        }

        // 2. RECORD INDIVIDUAL STUDENT SCANS (Triggered every time a QR is scanned)
        // This links the Student to the specific Trip
        [HttpPost]
        public IActionResult RecordScan(string lrn, string tripId)
        {
            if (string.IsNullOrEmpty(lrn) || string.IsNullOrEmpty(tripId))
            {
                return Json(new { success = false, message = "Missing LRN or Trip ID" });
            }

            var newScan = new StudentScan
            {
                LRN = lrn.Trim(),
                TripId = tripId.Trim(), // Matches the current Trip ID
                Date = DateTime.Now.ToString("MMM dd, yyyy"),
                ScanTime = DateTime.Now.ToString("hh:mm tt"),
                Status = "Boarded"
            };

            
            SchoolDashboard._scanHistory.Add(newScan);

            return Json(new { success = true });
        }
    }
}