export const generatePath = (width = 1000000, height = 1000000) =>
  Array(Math.round(Math.random()*4)+4)
    .fill()
    .map((_, i, array) => ({
        time: Date.now() + (i*((Math.random()*300)+500)),
        position: {
          x: i === (array.length-1)
              ? width
              : i === 0
                  ? 0
                  : (width/array.length) * (i),
          y: i === 0
              ? Math.random() * height/2
              : Math.random() * (height*(i+1)/array.length) + (height/array.length)
        }
      })
    )

export default generatePath()
