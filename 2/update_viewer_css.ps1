$content = Get-Content -Path "style.css" -Raw

$targetStyles = "/* Zoom wrapper shouldn't block checks unless image is clicked */
.zoom-wrapper {
    pointer-events: none;
}


.zoom-wrapper img {
    pointer-events: auto;
    /* Sadece resim tıklanabilir olsun (zoom/pan için) */
}"

$newStyles = "/* --- NEW Dynamic Photo Viewer Carousel --- */
.viewer-content {
    flex: 1;
    width: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
}

.viewer-track {
    display: flex;
    height: 100%;
    width: 100%;
    transition: transform 0.4s cubic-bezier(0.1, 0, 0.3, 1);
    will-change: transform;
}

.viewer-slide {
    flex: 0 0 100%;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    user-select: none;
}

.viewer-image-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    will-change: transform;
    pointer-events: auto;
}

.viewer-slide img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    user-drag: none;
    -webkit-user-drag: none;
    transform-origin: center center;
    box-shadow: 0 5px 30px rgba(0,0,0,0.3);
}

.viewer-track.is-dragging {
    transition: none !important;
}"

# Replace the target styles with new styles
$content = $content -replace [regex]::Escape($targetStyles), $newStyles
$content | Set-Content -Path "style.css" -Encoding Ascii
