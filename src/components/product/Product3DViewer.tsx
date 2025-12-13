import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Html } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Box, Loader2, RotateCcw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface Product3DViewerProps {
  modelUrl: string;
  productName: string;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Загрузка 3D модели...</p>
      </div>
    </Html>
  );
}

const Product3DViewer = ({ modelUrl, productName }: Product3DViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const ViewerContent = ({ size = "normal" }: { size?: "normal" | "fullscreen" }) => (
    <div className={size === "fullscreen" ? "w-full h-full" : "w-full aspect-square"}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        className="bg-muted rounded-lg"
      >
        <Suspense fallback={<LoadingFallback />}>
          <Stage environment="city" intensity={0.6}>
            <Model url={modelUrl} />
          </Stage>
          <OrbitControls
            autoRotate
            autoRotateSpeed={2}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Suspense>
      </Canvas>

      {/* Controls overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2">
        <span className="text-xs text-muted-foreground">Вращайте мышью</span>
        <RotateCcw className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );

  return (
    <div className="relative">
      <div className="relative">
        <ViewerContent />
        
        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[80vh]">
            <ViewerContent size="fullscreen" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Box className="h-4 w-4" />
        <span>3D-просмотр товара</span>
      </div>
    </div>
  );
};

export default Product3DViewer;