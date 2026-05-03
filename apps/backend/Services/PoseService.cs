using System.Text.Json;
using backend.Models;
using backend.DTOs.Responses;

namespace backend.Services;

public interface IPoseService
{
    Task<PoseListResponse> GetAllAsync();
    Task<PoseResponse?> GetByIdAsync(string id);
    Task<IEnumerable<PoseResponse>> GetByCategoryAsync(string category);
}

public class PoseService(IWebHostEnvironment env, IHttpContextAccessor httpContextAccessor) : IPoseService
{
    private readonly IWebHostEnvironment _env = env;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    private class PosesData
    {
        public List<Pose> Poses { get; set; } = [];
        public List<PoseCategory> Categories { get; set; } = [];
    }

    private PoseResponse ToResponse(Pose pose)
    {
        var request = _httpContextAccessor.HttpContext?.Request;
        var thumbnailUrl = pose.Thumbnail is not null && request is not null
            ? $"{request.Scheme}://{request.Host}/thumbnails/{pose.Thumbnail}"
            : null;

        return new PoseResponse
        {
            Id = pose.Id,
            Name = pose.Name,
            Category = pose.Category,
            Description = pose.Description,
            Color = pose.Color,
            LineWidth = pose.LineWidth,
            Opacity = pose.Opacity,
            ThumbnailUrl = thumbnailUrl
        };
    }

    private async Task<PosesData> LoadDataAsync()
    {
        var jsonPath = Path.Combine(_env.ContentRootPath, "Data", "poses.json");
        if (!File.Exists(jsonPath)) return new PosesData();

        var json = await File.ReadAllTextAsync(jsonPath);
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

        return JsonSerializer.Deserialize<PosesData>(json, options) ?? new PosesData();
    }

    public async Task<PoseListResponse> GetAllAsync()
    {
        var data = await LoadDataAsync();
        return new PoseListResponse
        {
            Poses = data.Poses.Select(ToResponse),
            Categories = data.Categories.Select(c => new PoseCategoryResponse
            {
                Id = c.Id,
                Label = c.Label,
                Color = c.Color
            })
        };
    }

    public async Task<PoseResponse?> GetByIdAsync(string id)
    {
        var data = await LoadDataAsync();
        var pose = data.Poses.FirstOrDefault(p => p.Id == id);
        return pose is not null ? ToResponse(pose) : null;
    }

    public async Task<IEnumerable<PoseResponse>> GetByCategoryAsync(string category)
    {
        var data = await LoadDataAsync();
        return data.Poses.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).Select(ToResponse);
    }
}