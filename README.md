# Pixel-Simulator-3

# SpacePixel Documentation

## Introduction

SpacePixel is a spatial programming language, based on [SpaceTode](https://todepond.gitbook.io/spacetode/).

The source code for SpacePixel is [here]().

## Pixels

Pixels can be defined using the `pixel` keyword.

Example:

```
pixel Sand {

}
```

The name of a pixel must start with an uppercase letter and may not contain spaces.

## Data

Pixels can store data. This data can be booleans, numbers, or strings. Use the `data` keyword to define data for a pixel. You need to specify the default value. Pixel data is unique for each pixel. Use the `const` keyword to make a piece of data constant.

Example:

```
pixel Sand {
    data sandy true
    const data color "yellow"
    data temperature 1
}
```

## Rules

Rules say how a pixel interacts with other pixels. Use the `rule` keyword to define a rule.

Rules are defined by drawing diagrams. A pixel checks if it satisfies all conditions in the left side of the diagram, and if it does, it changes the world to look like the right side of the diagram.

Example:

```
pixel Sand {
    rule {
        @ => _
        _    @
    }
}
```

In this rule, if a sand pixel is on top of an air pixel, the sand will swap places with the air pixel.

Rules are matched from top down.

### Stop

The `stop` keyword in a rule will cause the pixel to stop executing other rules.

## Diagrams

The left side of a diagram is the input side, and the right side is the output side.

### Inputs

Built-in inputs:

* `@` This pixel
* `_` An air pixel
* `#` A non-air pixel
* `.` Any pixel
* `*` Not a pixel (outside the grid)

Exactly one `@` must be used in the input side.

Other inputs can be defined using the `input` keyword. Note that inputs cannot be used out of scope. An input defined within a rule cannot be used outside that rule.

When defining an input, `Any` can be used to match all pixels, and `Self` can be used to match pixels of itself.

### Outputs

Built-in outputs:

* `@` This pixel
* `_` Air
* `.` Do nothing

At most one `@` may be used on the output side.

Other outputs can be defined using the `output` keyword. Note that outputs cannot be used out of scope. An output defined within a rule cannot be used outside that rule.

When defining an output, `Self` can be used to match pixels of itself. Inputs can be used to define an output.

Example:

```
pixel Sand {
    rule {
        input A = Any(temperature > 10)
        input B = Sand(temperature <= self.temperature)
        input C = Air(temperature = 1)
        output A = A(temperature = 10)
        output B = Water()

        A@A => .A@
        CCB    BBB
    }
}
```

## Symmetry

Symmetry can be added to a diagram using the `symmetry` keyword. Use `flip x` to allow flips over the x axis, `flip y` to allow flips over the y axis, and `rotate` to allow rotations.

Example:

```
pixel Sand {
    rule {
        input A = Any(temperature = 1)

        symmetry (flip y, rotate) {
            @A => @_
        }
    }
}
```

## Conditionals

### Data

Using `self`, the data of the pixel can be compared.

Data conditionals may be used when defining rules, inputs, and outputs.

Example:

```
pixel Sand {
    data sandy true

    rule (self.sandy = true) {
        @ => _
        _    @
    }
}
```

The pixel will fall if it is `sandy`.

### Special Data

* `x` x coordinate of pixel
* `y` y coordinate of pixel
* `tick` ticks since simulation started

### Maybe

The `maybe` keyword specifies the chance of a rule happening.

Maybe conditionals may only be used when defining rules.

Example:

```
pixel Sand {
    rule (Maybe(1 / 2)) {
        @ => _
        _    @
    }
}
```

The pixel will fall with a 1 / 2 chance.

## Mimic

Use the `mimic` keyword to make pixels copy other pixels.

Example:

```
pixel Sand {
    rule (Maybe(1 / 10)) {
        symmetry (flip y) {
            @_ => _@
        }
    }
    rule {
        mimic(Dirt)
    }
}
```

The pixel has a 1 / 10 chance to move sideways, otherwise it will mimic the rules of a dirt pixel.