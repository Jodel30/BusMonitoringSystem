using Microsoft.AspNetCore.Mvc;
using MonitoringSystem.Models;
using System.Linq;

namespace MonitoringSystem.Controllers
{
    public class DriverDashboard : Controller
    {
        
        public static List<TripLog> _tripHistory = new List<TripLog>();

        public IActionResult Driver()
        {
            // 1. Create the package
            var viewModel = new DriverDashboardViewModel
            {
                // Get the history from THIS controller
                TripHistory = _tripHistory,

                // Get the students from the SCHOOL controller (filtered to only show Active)
                RegisteredStudents = SchoolDashboard._studentList
                                        .Where(s => s.Status == "Active" || string.IsNullOrEmpty(s.Status))
                                        .ToList()
            };

            // 2. Return the package to the View
            return View(viewModel);
        }

        // 1. SAVE THE TRIP SUMMARY (Triggered when "End Trip" is clicked)

[HttpPost]
    public IActionResult SaveTrip([FromBody] TripLog data)
    {
        if (data != null)
        {
           
            int realCount = SchoolDashboard._scanHistory.Count(s => s.TripId == data.TripId.Trim());

            // Update the model with the real number before saving
            data.BoardedCount = realCount;

            // Add to the history list
            _tripHistory.Add(data);

            return Json(new
            {
                success = true,
                message = $"Trip {data.TripId} saved. Total students recorded: {realCount}"
            });
        }

        return Json(new { success = false, message = "Invalid trip data" });
    }

        [HttpPost]
        public IActionResult RecordScan(string lrn, string tripId, bool isManual = false, string reason = "")
        {
            if (string.IsNullOrEmpty(lrn) || string.IsNullOrEmpty(tripId))
            {
                return Json(new { success = false, message = "Missing Data" });
            }

            // 1. REACH INTO THE SCHOOL DASHBOARD LIST
            var student = SchoolDashboard._studentList.FirstOrDefault(s => s.LRN.Trim() == lrn.Trim());

            if (student != null)
            {
                // A. Update Last Seen (For the Absence Alert)
                student.LastBoardingDate = DateTime.Now.ToString("MMM dd, yyyy");
                student.AbsenceAlertResolved = false; // Reset alert since they are back

                // B. Handle Manual Counter (For the ID Replacement Alert)
                if (isManual)
                {
                    student.ManualCheckInCount++;
                }
            }

            // 2. CREATE THE LOG ENTRY (Same as before)
            var newScan = new StudentScan
            {
                LRN = lrn.Trim(),
                TripId = tripId.Trim(),
                Date = DateTime.Now.ToString("MMM dd, yyyy"),
                ScanTime = DateTime.Now.ToString("hh:mm tt"),
                Status = isManual ? $"Manual ({reason})" : "QR Scanned"
            };

            SchoolDashboard._scanHistory.Add(newScan);

            // 3. RETURN DATA
            int totalCount = SchoolDashboard._scanHistory.Count(s => s.TripId == tripId.Trim());
            return Json(new { success = true, currentCount = totalCount });
        }

    }
}