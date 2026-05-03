namespace backend.Models;

public class Pose
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Color { get; set; } = "#00E5FF";
    public float LineWidth { get; set; } = 3;
    public float Opacity { get; set; } = 0.75f;
    public string? Thumbnail { get; set; }
}