# twxyz

## Usage

```html
<!DOCTYPE html>
<html>
  <head>
    <title>twixyz</title>
    <script src="./twxyz.umd.js"></script>
  </head>
  <body>
    <script>
      const config = {
        puzzle: '3x3x3'
      }
      const algorithm = "RUR'U'"

      const player = new TWXYZ.InteractivePlayer( config )

      document.body.appendChild( player.domElement )

      player.play( algorithm ) // play algorithm
      
      /* 

      // TWXYZ.InteractivePlayer.play() returns Promise object.
      player.play( "URU'R'", false ) // set premoves(The second argument specifies whether to animate or not. default is true)
      .then(() => player.play( "RUR'U'" )) // play algorithm

      */
    </script>
  </body>
</html>
```
