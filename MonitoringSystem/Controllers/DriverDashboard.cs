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



        [HttpPost]
        public IActionResult SaveTrip([FromBody] TripLog data)
        {
            if (data != null)
            {
               
                if (AccountController.CurrentUser != null)
                {
                    data.DriverName = AccountController.CurrentUser.FullName;
                }
                else
                {
                    // Fallback for demo if no one is logged in
                    data.DriverName = "System Admin";
                }

                // 1. Calculate the real count from the scan history records
                int realCount = SchoolDashboard._scanHistory.Count(s => s.TripId == data.TripId.Trim());

                // 2. Update the model with the real count
                data.BoardedCount = realCount;

                // 3. Add to the permanent history list
                _tripHistory.Add(data);

                return Json(new
                {
                    success = true,
                    // Include the name in the alert so the driver sees it worked
                    message = $"Trip {data.TripId} successfully saved by {data.DriverName}. Total students: {realCount}"
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