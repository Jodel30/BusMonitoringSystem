using Microsoft.AspNetCore.Mvc;
using MonitoringSystem.Data;
using MonitoringSystem.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MonitoringSystem.Controllers
{
    public class LguDashboardController : Controller
    {
        private readonly ApplicationDbContext _context;

        public LguDashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            // 1. Fetch data from the new table names defined in DbContext
            var students = _context.Students.ToList();
            var allActivities = _context.TransportActivities.ToList();
            var today = DateTime.Now;

            // --- UPDATED LOGIC: Map LRN to StudentLRN and Status to isActive ---
            foreach (var s in students)
            {
                // We count trips from the TransportActivities table
                // Since the ERD uses StudentID (int), we link by ID for better performance
                int tripCount = allActivities.Count(act =>
                    act.StudentID == s.StudentID &&
                    act.Time != null // In a real app, you'd check a Date field here too
                );

                s.WeeklyTripCount = tripCount;

                // Check alerts only on Friday for active students
                if (today.DayOfWeek == DayOfWeek.Friday && s.Status == "Active" && !s.LowUsageAlertResolved)
                {
                    s.IsLowUsage = (tripCount <= 3);
                }
                else
                {
                    s.IsLowUsage = false;
                }
            }

            // 2. Prepare ViewModel using new table names
            var viewModel = new LguDashboardViewModel
            {
                Students = students,
                // Changed TripLogs to Trips
                TripLogs = _context.Trips.OrderByDescending(t => t.TripID).ToList(),
                // Changed Accounts to Users
                Accounts = _context.Users.ToList(),
                // Changed sorting to LogDate
                ActivityLogs = _context.ActivityLogs.OrderByDescending(l => l.LogDate).ThenByDescending(l => l.LogTime).ToList()
            };

            // 3. PRE-CALCULATE ALERTS (Using AsEnumerable to allow C# logic checks)
            var studentEnum = students.AsEnumerable();
            ViewBag.ReviewCount = studentEnum.Count(s => s.NeedsUpdate);
            ViewBag.ManualCount = studentEnum.Count(s => s.NeedsNewQR);
            ViewBag.AbsenceCount = studentEnum.Count(s => s.IsLongAbsence);
            ViewBag.LowUsageCount = studentEnum.Count(s => s.IsLowUsage);

            ViewBag.TotalAlerts = (int)ViewBag.ReviewCount + (int)ViewBag.ManualCount +
                                  (int)ViewBag.AbsenceCount + (int)ViewBag.LowUsageCount;

            return View(viewModel);
        }

        [HttpPost]
        public IActionResult ResolveLowUsageAlert(string lrn)
        {
            // Changed LRN to StudentLRN
            var student = _context.Students.FirstOrDefault(s => s.StudentLRN.Trim() == lrn.Trim());

            if (student != null)
            {
                student.LowUsageAlertResolved = true;
                _context.SaveChanges();
                return Json(new { success = true });
            }
            return Json(new { success = false });
        }

        [HttpPost]
        public IActionResult RegisterAccount(SystemAccount model)
        {
            if (model != null)
            {
                // Changed Accounts to Users
                _context.Users.Add(model);
                _context.SaveChanges();

                return Redirect(Url.Action("Index") + "#user");
            }

            return RedirectToAction("Index");
        }

        [HttpPost]
        public IActionResult UpdateAccountCredentials(string OriginalUsername, string NewUsername, string NewPassword)
        {
            // Changed Accounts to Users
            var account = _context.Users.FirstOrDefault(u => u.Username == OriginalUsername);

            if (account != null)
            {
                account.Username = NewUsername;
                account.Password = NewPassword;
                _context.SaveChanges();
            }

            return Redirect(Url.Action("Index") + "#user");
        }
    }
}