import Logo from "../../assets/Tanfeezletter.png";

export function TanfeezLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="text-center">
        {/* Animated Logo/Brand */}
        <div className="">
          <div className="relative">
            {/* Main logo circle with pulse animation */}
            <div className="w-[30%] h-[30%] mx-auto rounded-full flex items-center justify-center animate-pulse ">
              <img
                src={Logo}
                alt="Tanfeez Logo"
                className="w-[100%] h-[80%] object-contain"
                width={120}
                height={96}
              />
            </div>
          </div>
        </div>
        {/* Loading dots */}
        <div className="flex justify-center space-x-2 mb-8">
          <div className="w-3 h-3 bg-[#4E8476] rounded-full animate-bounce"></div>
          <div
            className="w-3 h-3 bg-[#4E8476] rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-3 h-3 bg-[#4E8476] rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>

        {/* Progress bar */}
        <div className="w-64 mx-auto">
          <div className="w-full bg-blue-200 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#4E8476] to-[#4E8476] rounded-full animate-progress-bar"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
