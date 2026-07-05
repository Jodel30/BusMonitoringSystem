using Microsoft.AspNetCore.Mvc;
using MonitoringSystem.Helpers;
using MonitoringSystem.Models;
using System.Linq;


namespace MonitoringSystem.Controllers
{
    public class DriverDashboard : Controller
    {

        public static List<TripLog> _tripHistory = new List<TripLog>()
{
    // MOCK DATA FOR TESTING
    new TripLog {
        TripId = "TRP-001",
        Shift = "AM",
        Date = "5/09/2024",
        DriverName = "Ricardo Dalisay",
        BoardedCount = 15,
        StartTime = "07:00 AM",
        EndTime = "07:45 AM"
    },
    new TripLog {
        TripId = "TRP-002",
        Shift = "PM",
        Date = "5/09/2024",
        DriverName = "Juan Dela Cruz",
        BoardedCount = 12,
        StartTime = "04:30 PM",
        EndTime = "05:15 PM"
    },
    new TripLog {
        TripId = "TRP-003",
        Shift = "AM",
        Date = "5/10/2024",
        DriverName = "Ricardo Dalisay",
        BoardedCount = 20,
        StartTime = "07:10 AM",
        EndTime = "07:55 AM"
    }
};

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

        // 1. --- THE SECURITY DECRYPTION ---
        // Fallback starts as the raw input
        string cleanLrn = lrn.Trim();

        if (!isManual) // Only try to decrypt if it came from the QR Scanner
        {
            try
            {
                // Fix URL encoding: Restore '+' signs that often turn into spaces
                string inputToDecrypt = lrn.Trim().Replace(" ", "+");
                string decryptedData = SecurityHelper.Decrypt(inputToDecrypt);

                // Extract just the number from "STMS-DATA|LRN:12345|..."
                if (decryptedData.Contains("LRN:"))
                {
                    cleanLrn = decryptedData.Split("LRN:")[1].Split("|")[0].Trim();
                }
            }
            catch
            {
                // If it can't be decrypted and isn't manual, it's a fake/invalid code
                return Json(new { success = false, message = "Security Error: Invalid QR Code" });
            }
        }

        // 2. REACH INTO THE SCHOOL DASHBOARD LIST USING THE CLEAN LRN
        var student = SchoolDashboard._studentList.FirstOrDefault(s => s.LRN.Trim() == cleanLrn);

        if (student != null)
        {
            // A. Update Last Seen (For the Absence Alert)
            student.LastBoardingDate = DateTime.Now.ToString("MMM dd, yyyy");
            student.AbsenceAlertResolved = false;

            // B. Handle Manual Counter (For the ID Replacement Alert)
            if (isManual)
            {
                student.ManualCheckInCount++;
            }
        }

        // 3. CREATE THE LOG ENTRY (Saving the Clean LRN, not the encrypted one)
        var newScan = new StudentScan
        {
            LRN = cleanLrn,
            TripId = tripId.Trim(),
            Date = DateTime.Now.ToString("MMM dd, yyyy"),
            ScanTime = DateTime.Now.ToString("hh:mm tt"),
            Status = isManual ? $"Manual ({reason})" : "QR Scanned"
        };

        SchoolDashboard._scanHistory.Add(newScan);

        // 4. RETURN DATA
        int totalCount = SchoolDashboard._scanHistory.Count(s => s.TripId == tripId.Trim());
        return Json(new { success = true, currentCount = totalCount });
    }

}
}