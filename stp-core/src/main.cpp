#include <GLFW/glfw3.h>

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>

namespace stp {

struct Transform {
    float px{0.0f}, py{0.0f}, pz{0.0f};
    float rx{0.0f}, ry{0.0f}, rz{0.0f};
    float sx{1.0f}, sy{1.0f}, sz{1.0f};
};

struct Entity {
    std::uint32_t id{};
    std::string name;
    Transform transform{};
};

class SceneManager {
public:
    Entity& createEntity(std::string name) {
        Entity entity;
        entity.id = nextId_++;
        entity.name = std::move(name);
        entities_.push_back(std::move(entity));
        return entities_.back();
    }

    void fixedUpdate(double /*fixedDt*/) {
        // Empty on purpose for Foundation V1.
        // Football gameplay systems will plug into this fixed-step update later.
    }

    [[nodiscard]] std::size_t entityCount() const { return entities_.size(); }

private:
    std::vector<Entity> entities_;
    std::uint32_t nextId_{1};
};

class ResourceManager {
public:
    struct ResourceState {
        std::string name;
        bool loaded{false};
    };

    void registerResource(std::string key, std::string displayName) {
        resources_[std::move(key)] = ResourceState{std::move(displayName), false};
    }

    void preloadAll() {
        // Foundation V1 contains no heavy football assets yet.
        // This establishes the ownership/lifetime path that real meshes,
        // textures, sounds and animations will use next.
        for (auto& [_, resource] : resources_) {
            resource.loaded = true;
        }
    }

    void unloadAll() {
        for (auto& [_, resource] : resources_) {
            resource.loaded = false;
        }
    }

    [[nodiscard]] std::size_t loadedCount() const {
        std::size_t count = 0;
        for (const auto& [_, resource] : resources_) {
            if (resource.loaded) ++count;
        }
        return count;
    }

    [[nodiscard]] std::size_t totalCount() const { return resources_.size(); }

private:
    std::unordered_map<std::string, ResourceState> resources_;
};

class InputManager {
public:
    void update(GLFWwindow* window, double frameDt) {
        glfwPollEvents();

        left_ = keyDown(window, GLFW_KEY_Q) || keyDown(window, GLFW_KEY_LEFT);
        right_ = keyDown(window, GLFW_KEY_D) || keyDown(window, GLFW_KEY_RIGHT);
        forward_ = keyDown(window, GLFW_KEY_Z) || keyDown(window, GLFW_KEY_UP);
        backward_ = keyDown(window, GLFW_KEY_S) || keyDown(window, GLFW_KEY_DOWN);

        const bool shootNow = keyDown(window, GLFW_KEY_SPACE);
        if (shootNow) {
            shootHoldSeconds_ += frameDt;
        } else if (shootDownLastFrame_) {
            lastShootHoldSeconds_ = shootHoldSeconds_;
            shootHoldSeconds_ = 0.0;
        }
        shootDownLastFrame_ = shootNow;

        gamepadConnected_ = glfwJoystickIsGamepad(GLFW_JOYSTICK_1) == GLFW_TRUE;
        if (gamepadConnected_) {
            GLFWgamepadstate state{};
            if (glfwGetGamepadState(GLFW_JOYSTICK_1, &state) == GLFW_TRUE) {
                leftStickX_ = state.axes[GLFW_GAMEPAD_AXIS_LEFT_X];
                leftStickY_ = -state.axes[GLFW_GAMEPAD_AXIS_LEFT_Y];
                leftTrigger_ = (state.axes[GLFW_GAMEPAD_AXIS_LEFT_TRIGGER] + 1.0f) * 0.5f;
                rightTrigger_ = (state.axes[GLFW_GAMEPAD_AXIS_RIGHT_TRIGGER] + 1.0f) * 0.5f;
            }
        } else {
            leftStickX_ = 0.0f;
            leftStickY_ = 0.0f;
            leftTrigger_ = 0.0f;
            rightTrigger_ = 0.0f;
        }
    }

    [[nodiscard]] bool quitRequested(GLFWwindow* window) const {
        return glfwWindowShouldClose(window) || keyDown(window, GLFW_KEY_ESCAPE);
    }

    [[nodiscard]] std::string debugText() const {
        std::ostringstream out;
        out << "move="
            << (forward_ ? 'F' : '-')
            << (backward_ ? 'B' : '-')
            << (left_ ? 'L' : '-')
            << (right_ ? 'R' : '-')
            << " shootHold=" << std::fixed << std::setprecision(2) << shootHoldSeconds_ << "s"
            << " pad=" << (gamepadConnected_ ? "yes" : "no")
            << " LS(" << leftStickX_ << ',' << leftStickY_ << ')'
            << " LT=" << leftTrigger_ << " RT=" << rightTrigger_;
        return out.str();
    }

private:
    static bool keyDown(GLFWwindow* window, int key) {
        return glfwGetKey(window, key) == GLFW_PRESS;
    }

    bool left_{false};
    bool right_{false};
    bool forward_{false};
    bool backward_{false};
    bool shootDownLastFrame_{false};
    bool gamepadConnected_{false};
    double shootHoldSeconds_{0.0};
    double lastShootHoldSeconds_{0.0};
    float leftStickX_{0.0f};
    float leftStickY_{0.0f};
    float leftTrigger_{0.0f};
    float rightTrigger_{0.0f};
};

class WindowManager {
public:
    ~WindowManager() { shutdown(); }

    bool initialize(int width, int height, const char* title) {
        if (glfwInit() != GLFW_TRUE) {
            std::cerr << "GLFW initialization failed.\n";
            return false;
        }

        glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
        glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
        glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
#if defined(__APPLE__)
        glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GLFW_TRUE);
#endif

        window_ = glfwCreateWindow(width, height, title, nullptr, nullptr);
        if (!window_) {
            std::cerr << "Window creation failed.\n";
            glfwTerminate();
            return false;
        }

        glfwMakeContextCurrent(window_);
        glfwSwapInterval(1); // V-Sync ON.
        return true;
    }

    void beginFrame() const {
        int width = 0;
        int height = 0;
        glfwGetFramebufferSize(window_, &width, &height);
        glViewport(0, 0, width, height);

        // Requirement [5]: clear the screen with a pitch-green color each frame.
        glClearColor(0.055f, 0.24f, 0.10f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    }

    void endFrame() const { glfwSwapBuffers(window_); }

    void setTitle(const std::string& title) const { glfwSetWindowTitle(window_, title.c_str()); }

    [[nodiscard]] GLFWwindow* handle() const { return window_; }

    void shutdown() {
        if (window_) {
            glfwDestroyWindow(window_);
            window_ = nullptr;
        }
        if (glfwInitialized_) {
            glfwTerminate();
            glfwInitialized_ = false;
        }
    }

private:
    GLFWwindow* window_{nullptr};
    bool glfwInitialized_{true};
};

} // namespace stp

int main() {
    using Clock = std::chrono::steady_clock;

    stp::WindowManager window;
    if (!window.initialize(1280, 720, "STP Core Foundations V1")) {
        return 1;
    }

    stp::InputManager input;
    stp::ResourceManager resources;
    stp::SceneManager scene;

    resources.registerResource("core://bootstrap", "Core bootstrap resource");
    resources.preloadAll();

    auto& root = scene.createEntity("EngineRoot");
    root.transform = {};

    constexpr double fixedDt = 1.0 / 60.0;
    constexpr double maxFrameDt = 0.25;

    auto previous = Clock::now();
    double accumulator = 0.0;
    double titleTimer = 0.0;
    int framesInWindow = 0;
    std::uint64_t fixedTick = 0;

    while (!input.quitRequested(window.handle())) {
        const auto now = Clock::now();
        double frameDt = std::chrono::duration<double>(now - previous).count();
        previous = now;
        frameDt = std::clamp(frameDt, 0.0, maxFrameDt);

        input.update(window.handle(), frameDt);
        accumulator += frameDt;

        while (accumulator >= fixedDt) {
            scene.fixedUpdate(fixedDt);
            accumulator -= fixedDt;
            ++fixedTick;
        }

        window.beginFrame();
        window.endFrame();

        titleTimer += frameDt;
        ++framesInWindow;
        if (titleTimer >= 0.25) {
            const double fps = framesInWindow / titleTimer;
            std::ostringstream title;
            title << "STP Core Foundations V1 | FPS " << std::fixed << std::setprecision(0) << fps
                  << " | dt " << std::setprecision(2) << frameDt * 1000.0 << " ms"
                  << " | physics 60 Hz tick " << fixedTick
                  << " | assets " << resources.loadedCount() << '/' << resources.totalCount()
                  << " | entities " << scene.entityCount()
                  << " | " << input.debugText();
            window.setTitle(title.str());
            titleTimer = 0.0;
            framesInWindow = 0;
        }
    }

    resources.unloadAll();
    return 0;
}
