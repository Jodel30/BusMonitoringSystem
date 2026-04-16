using Microsoft.AspNetCore.Mvc;

namespace MonitoringSystem.Controllers
{
    public class LguDashboardController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
