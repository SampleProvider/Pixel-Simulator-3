pixel Sand {
    data refined true
    const data temperature 1

    draw {
        vertices = mimic(Air)
        colors = [1, 0, 0, 1, 0, 1, 0, 1]
    }

    rule {
        input S = Sand(refined = false, temperature = 4)

        symmetry (rotate) {
            @S => @_
            SS    __
        }

        stop
    }

    rule (maybe(1 / 2)) {
        output W = Water(wetness = 10)

        symmetry (flip x, flip y, rotate) {
            @ => W
            _    @
        }
    }

    rule (self.temperature < 10 && refined = true) {
        input H = Any(sandy = true)
        output W = Water(wetness = 10)

        symmetry (flip x, flip y, rotate) {
            @ => W
            H    @
        }
    }

    mimic(Water)
}