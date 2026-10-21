import os
import subprocess
from pathlib import Path

def transcode_to_h264(input_path: Path, output_path: Path) -> bool:
    """
    Transcodes an OpenCV-generated video file into a 100% browser-compatible
    MP4 video with H.264 (AVC1) video codec, YUV420P pixel format, and +faststart flag.
    This ensures smooth playback in HTML5 <video> elements across Chrome, Edge, Safari, and Firefox.
    """
    try:
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception as e:
        print(f"[Video Transcode] imageio_ffmpeg not available: {e}")
        return False

    cmd = [
        ffmpeg_exe,
        "-y",
        "-i", str(input_path),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "ultrafast",
        "-movflags", "+faststart",
        str(output_path)
    ]

    try:
        print(f"[Video Transcode] Starting H.264 transcode: {input_path.name} -> {output_path.name}...")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
        if result.returncode == 0 and output_path.exists() and output_path.stat().st_size > 0:
            print(f"[Video Transcode] Success! Browser-compatible video ready ({output_path.stat().st_size} bytes)")
            # Clean up temporary raw video file
            if input_path.exists() and input_path != output_path:
                try:
                    input_path.unlink()
                except Exception:
                    pass
            return True
        else:
            print(f"[Video Transcode] FFmpeg failed with code {result.returncode}: {result.stderr[:300]}")
            return False
    except Exception as exc:
        print(f"[Video Transcode] Exception during transcoding: {exc}")
        return False
