cmake_minimum_required(VERSION 3.20)
project(STPCoreFoundations VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

include(FetchContent)

set(GLFW_BUILD_DOCS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)

FetchContent_Declare(
  glfw
  GIT_REPOSITORY https://github.com/glfw/glfw.git
  GIT_TAG 3.4
)
FetchContent_MakeAvailable(glfw)

find_package(OpenGL REQUIRED)

add_executable(stp_core
  src/main.cpp
)

target_link_libraries(stp_core PRIVATE glfw OpenGL::GL)

if(MSVC)
  target_compile_options(stp_core PRIVATE /W4 /permissive-)
else()
  target_compile_options(stp_core PRIVATE -Wall -Wextra -Wpedantic)
endif()
