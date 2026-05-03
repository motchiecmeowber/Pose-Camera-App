using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PosesController(IPoseService poseService, ILogger<PosesController> logger) : ControllerBase
{
    private readonly IPoseService _poseService = poseService;
    private readonly ILogger<PosesController> _logger = logger;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var result = await _poseService.GetAllAsync();
            return Ok(new { data = result });
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error retrieving list of poses");
            return StatusCode(500, new { error = "Unable to load pose list" });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var pose = await _poseService.GetByIdAsync(id);
        if (pose is null) return NotFound(new { error = $"Pose '{id}' not found" });

        return Ok(new { data = pose });
    }

    [HttpGet("category/{category}")]
    public async Task<IActionResult> GetByCategory(string category)
    {
        var poses = await _poseService.GetByCategoryAsync(category);
        return Ok(new { data = poses });
    }
}