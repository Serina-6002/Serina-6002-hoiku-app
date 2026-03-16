"use client";

import Lottie from "lottie-react";
import loadingAnimation from "@/lottie/loading.json";

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Lottie
          animationData={loadingAnimation}
          loop
          className="h-40 w-40"
        />
        <p className="text-sm font-medium text-text-light">読み込み中...</p>
      </div>
    </div>
  );
}
