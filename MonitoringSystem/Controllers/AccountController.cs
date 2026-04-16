using Microsoft.AspNetCore.Mvc;

namespace MonitoringSystem.Controllers
{
    public class AccountController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
