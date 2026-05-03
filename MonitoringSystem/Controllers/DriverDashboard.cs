using Microsoft.AspNetCore.Mvc;
using MonitoringSystem.Models; 

namespace MonitoringSystem.Controllers
{
    public class DriverDashboard : Controller
    {
        // This static list will store all trips in memory while the app is running
        public static List<TripLog> _tripHistory = new List<TripLog>();

        public IActionResult Driver()
        {
            // Pass the history list to the View so the table shows previous trips
            return View(_tripHistory);
        }

        // This method receives the trip data from your JavaScript
        [HttpPost]
        public IActionResult SaveTrip([FromBody] TripLog data)
        {
            if (data != null)
            {
                _tripHistory.Add(data);
                return Json(new { success = true, message = "Trip saved successfully" });
            }
            return Json(new { success = false, message = "Invalid data" });
        }
    }
}
