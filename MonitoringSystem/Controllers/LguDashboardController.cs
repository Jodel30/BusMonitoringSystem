using Microsoft.AspNetCore.Mvc;

namespace MonitoringSystem.Controllers
{
    public class LguDashboardController : Controller
    {
        public IActionResult Index()
        {
            // This looks for Views/LguDashboard/Index.cshtml
            return View();
        }
    }
}
