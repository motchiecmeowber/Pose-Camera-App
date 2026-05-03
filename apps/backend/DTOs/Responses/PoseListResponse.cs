namespace backend.DTOs.Responses;

public class PoseListResponse
{
    public IEnumerable<PoseResponse> Poses { get; set; } = [];
    public IEnumerable<PoseCategoryResponse> Categories { get; set; } = [];
}