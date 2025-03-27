# Spring Launch Physics Game

A web-based physics simulation game that teaches Hooke's Law and projectile motion by challenging players to launch an object to hit three targets.

## Features

- Interactive spring mechanism with adjustable tension
- Real-time physics analytics (velocity, trajectory, position)
- Three targets at varying distances
- Visual feedback for target hits
- Clean, minimalistic grid-based interface

## How to Play

1. Adjust the spring's tension using the slider
2. Click the "Launch" button to fire the projectile
3. Try to hit all three targets to win
4. Observe real-time physics data as the projectile travels

## Physics Concepts Demonstrated

### Spring Mechanics (Hooke's Law)
This simulation demonstrates Hooke's Law, which states that the force needed to extend or compress a spring is proportional to the distance it is stretched or compressed from its equilibrium position. In mathematical terms:

```
F = -kx
```

Where:
- F is the restoring force exerted by the spring
- k is the spring constant (stiffness)
- x is the displacement from equilibrium

In our simulation, the spring tension slider directly controls the spring constant (k). Higher tension values result in greater initial velocity when the projectile is launched.

### Projectile Motion
The game illustrates the principles of projectile motion, where an object moves through space under the influence of gravity. Key concepts include:

1. **Parabolic Trajectory**: Objects launched at an angle follow a parabolic path due to constant gravitational acceleration.

2. **Independence of Horizontal and Vertical Motion**: The horizontal motion (constant velocity) and vertical motion (accelerated by gravity) are independent of each other.

3. **Initial Velocity Components**: The initial velocity is broken down into horizontal (vx) and vertical (vy) components:
   ```
   vx = v₀ * cos(θ)
   vy = v₀ * sin(θ)
   ```

4. **Range Equation**: The horizontal distance traveled depends on the initial velocity and launch angle:
   ```
   Range = (v₀² * sin(2θ)) / g
   ```

### Gravitational Effects
The simulation models the constant acceleration due to gravity (g). In the game, objects accelerate downward at a constant rate, demonstrating how gravity affects the projectile's path over time.

### Conservation of Energy
The spring-projectile system demonstrates energy conversion:
1. **Potential Energy**: Energy stored in the compressed spring
2. **Kinetic Energy**: Energy of motion as the projectile travels
3. **Energy Transfer**: Conversion from spring potential energy to projectile kinetic energy

### Air Resistance and Damping
A small amount of damping is applied to simulate air resistance, showing how real-world projectiles gradually lose energy due to friction with the air.

### Impact and Collision
The game demonstrates elastic and inelastic collisions when the projectile hits targets or the ground, illustrating principles of momentum transfer and energy conservation.

## Educational Applications

This simulation can be used to:
- Visualize abstract physics concepts in an interactive way
- Experiment with different parameters to see their effects on projectile motion
- Develop intuition about how spring force, gravity, and air resistance interact
- Practice predicting trajectories based on initial conditions
- Understand the mathematical relationships between distance, velocity, and time

## Tech Stack

- HTML5, CSS3
- JavaScript
- p5.js for rendering and animations

## Running the Game

Simply open `index.html` in a web browser to start playing.
