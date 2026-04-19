using Microsoft.AspNetCore.Mvc;

namespace MonitoringSystem.Controllers
{
    public class SchoolDashboard : Controller
    {
        public IActionResult SchoolAdmin()
        {
            return View();
        }
    }
}
