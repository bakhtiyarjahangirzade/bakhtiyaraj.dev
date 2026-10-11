import wave, math, random
from pathlib import Path
random.seed(27)
rate=48000
path=Path(__file__).resolve().parent.parent / 'public/apps/focus-room/assets/audio'
path.mkdir(parents=True,exist_ok=True)
samples=[]
previous=0
for i in range(int(rate*.11)):
    t=i/rate
    noise=random.uniform(-1,1)
    high=noise-previous*.75
    previous=noise
    snap=high*.45*math.exp(-t/0.0025)
    latch=high*.25*math.exp(-max(0,t-.025)/.0035) if t>=.025 else 0
    body=(math.sin(2*math.pi*920*t)*.2+math.sin(2*math.pi*2450*t)*.1)*math.exp(-t/.016)
    samples.append(max(-.9,min(.9,snap+latch+body)))
with wave.open(str(path/'radio-click.wav'),'wb') as out:
    out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate)
    out.writeframes(b''.join(int(s*32767).to_bytes(2,'little',signed=True) for s in samples))
(path/'LICENSE.txt').write_text('Radio-click sample synthesized for BAKHY Focus Room. No third-party recording.\n\n' + (Path(__file__).resolve().parent.parent/'LICENSE').read_text(), encoding='utf-8')

