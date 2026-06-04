using Microsoft.AspNetCore.Mvc;
using MonitoringSystem.Models;
using System.Linq; 

namespace MonitoringSystem.Controllers
{
    public class LguDashboardController : Controller
    {
        public static List<SystemAccount> _accountList = new List<SystemAccount>();
        public static List<ActivityLog> _activityLogs = new List<ActivityLog>();
        public IActionResult Index()
        {
            var viewModel = new LguDashboardViewModel
            {
                // Accessing the shared list correctly here:
                Students = SchoolDashboard._studentList,
                TripLogs = DriverDashboard._tripHistory,
                 Accounts = _accountList,
                ActivityLogs = _activityLogs.OrderByDescending(l => l.Timestamp).ToList()
            };

            return View(viewModel);
        }

        [HttpPost]
        public IActionResult ResolveLowUsageAlert(string lrn)
        {
            
            var student = SchoolDashboard._studentList.FirstOrDefault(s => s.LRN.Trim() == lrn.Trim());

            if (student != null)
            {
                student.LowUsageAlertResolved = true;
                return Json(new { success = true });
            }
            return Json(new { success = false });
        }
        [HttpPost]
        public IActionResult RegisterAccount(SystemAccount model)
        {
            if (model != null)
            {
                // 1. Add the new account to the SHARED static list
                _accountList.Add(model);

                // 2. Redirect back to the dashboard, jumping to the #user section
                return Redirect(Url.Action("Index") + "#user");
            }

            return RedirectToAction("Index");
        }

    }
}