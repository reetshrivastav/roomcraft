function RoomCanvas({
  roomWidth,
  roomHeight,
  layout,
  furnitureCatalog,
  doors = [],
  windows = [],
}) {
  const MAX_WIDTH = 800;
  const MAX_HEIGHT = 600;

  const scale = Math.min(
    MAX_WIDTH / roomWidth,
    MAX_HEIGHT / roomHeight,
    1
  );

  const canvasWidth = roomWidth * scale;
  const canvasHeight = roomHeight * scale;

  const getOpeningStyle = (opening) => {
    const size = 30 * scale;
    const thickness = 8;

    switch (opening.wall) {
      case "top":
        return {
          left: opening.x * scale,
          top: 0,
          width: size,
          height: thickness,
        };

      case "right":
        return {
          left: canvasWidth - thickness,
          top: opening.y * scale,
          width: thickness,
          height: size,
        };

      case "bottom":
        return {
          left: opening.x * scale,
          top: canvasHeight - thickness,
          width: size,
          height: thickness,
        };

      case "left":
        return {
          left: 0,
          top: opening.y * scale,
          width: thickness,
          height: size,
        };

      default:
        return {};
    }
  };

  return (
    <div
      style={{
        width: canvasWidth,
        height: canvasHeight,
        border: "3px solid black",
        position: "relative",
        backgroundColor: "#f5f5f5",
        overflow: "hidden",
      }}
    >
      {/* Doors */}
      {doors.map((door, index) => (
        <div
          key={`door-${index}`}
          style={{
            position: "absolute",
            ...getOpeningStyle(door),
            backgroundColor: "brown",
            zIndex: 5,
          }}
          title="Door"
        />
      ))}

      {/* Windows */}
      {windows.map((window, index) => (
        <div
          key={`window-${index}`}
          style={{
            position: "absolute",
            ...getOpeningStyle(window),
            backgroundColor: "skyblue",
            zIndex: 5,
          }}
          title="Window"
        />
      ))}

      {/* Furniture */}
      {layout.map((item) => {
        const furniture = furnitureCatalog.find(
          (f) => f.id === item.furnitureId
        );

        if (!furniture) {
          return null;
        }

        const isRotated =
          item.rotation === 90 || item.rotation === 270;

        const width = isRotated
          ? furniture.depth
          : furniture.width;

        const height = isRotated
          ? furniture.width
          : furniture.depth;

        return (
          <div
            key={item.furnitureId}
            style={{
              position: "absolute",
              left: item.x * scale,
              top: item.y * scale,
              width: width * scale,
              height: height * scale,
              border: "1px solid black",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontSize: "12px",
              boxSizing: "border-box",
              overflow: "hidden",
              zIndex: 2,
            }}
          >
            {furniture.name}
          </div>
        );
      })}
    </div>
  );
}

export default RoomCanvas;