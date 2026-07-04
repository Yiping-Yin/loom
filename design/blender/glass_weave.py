"""
glass_weave.py — a gallery-grade glass installation for LOOM's empty-state hero.

Fine vertical threads (the loom's warp, nearly invisible) suspending broken GLASS
shards (the user's sources) that gather denser toward the bottom into a luminous
whole. Real glass BSDF in a bright studio so the shards actually REFRACT and
sparkle — sophisticated / near-white, not a saturated glow. Transparent film.

Axes: X = horizontal (image), Y = depth (toward camera), Z = vertical (image).

Run: Blender --background --python design/blender/glass_weave.py
Out: design/blender/glass_weave.png  (RGBA)
"""
import bpy, bmesh, math, random, os

random.seed(20260704)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

scene.render.engine = 'CYCLES'
scene.cycles.samples = 384
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 24
scene.cycles.transmission_bounces = 20
scene.cycles.transparent_max_bounces = 24
scene.render.film_transparent = True
scene.render.resolution_x = 1000
scene.render.resolution_y = 1000
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'Standard'

try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = 'GPU'
    print("[glass_weave] GPU (Metal)")
except Exception as e:
    scene.cycles.device = 'CPU'; print("[glass_weave] CPU:", e)

# ---- materials ----
def glass_mat(name, tint, rough):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    g = nt.nodes.new('ShaderNodeBsdfGlass')
    g.inputs['Color'].default_value = (*tint, 1.0)
    g.inputs['Roughness'].default_value = rough
    g.inputs['IOR'].default_value = 1.45
    nt.links.new(g.outputs['BSDF'], out.inputs['Surface'])
    return m

def thread_mat():
    # a hair of light — very faint emission, mostly transparent.
    m = bpy.data.materials.new('thread'); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    mix = nt.nodes.new('ShaderNodeMixShader')
    trans = nt.nodes.new('ShaderNodeBsdfTransparent')
    emit = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Color'].default_value = (0.90, 0.96, 1.0, 1.0)
    emit.inputs['Strength'].default_value = 0.55
    mix.inputs['Fac'].default_value = 0.90     # 90% transparent -> barely there
    nt.links.new(trans.outputs['BSDF'], mix.inputs[1])
    nt.links.new(emit.outputs['Emission'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    return m

MAT_GLASS = [glass_mat('g0', (0.93, 0.98, 1.0), 0.01),
             glass_mat('g1', (0.85, 0.95, 1.0), 0.03),
             glass_mat('g2', (0.96, 0.99, 1.0), 0.0)]
MAT_THREAD = thread_mat()

TOP, BOT = 1.02, -1.02           # vertical (Z) extent of the weave

# ---- threads: vertical along Z, placed in an X-Y disc (centre-weighted) ----
N_THREADS = 85
homes = []
for _ in range(N_THREADS):
    a = random.uniform(0, 2 * math.pi)
    r = (random.random() ** 0.5) * 0.72
    x, yd = r * math.cos(a), r * math.sin(a) * 0.55   # squash depth so it reads flatter
    homes.append((x, yd))
    top = TOP + random.uniform(0.2, 0.9)              # hang from above the frame
    bot = BOT - random.uniform(0.0, 0.5)
    length = top - bot
    bpy.ops.mesh.primitive_cylinder_add(radius=random.uniform(0.0010, 0.0020),
                                        depth=length, vertices=6,
                                        location=(x, yd, (top + bot) * 0.5))
    bpy.context.active_object.data.materials.append(MAT_THREAD)

# ---- shards: hang on a home thread at a bottom-skewed height (Z) ----
def make_shard(loc, scale, mat):
    bm = bmesh.new()
    n = random.randint(3, 5)
    a0 = random.uniform(0, 2 * math.pi)
    vs = []
    for k in range(n):
        ang = a0 + (k / n) * 2 * math.pi + random.uniform(-0.5, 0.5)
        rad = random.uniform(0.5, 1.0)
        vs.append(bm.verts.new((math.cos(ang) * rad, 0.0, math.sin(ang) * rad)))
    try:
        bm.faces.new(vs)
    except Exception:
        pass
    me = bpy.data.meshes.new('shard'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('shard', me); bpy.context.collection.objects.link(o)
    o.modifiers.new('sol', 'SOLIDIFY').thickness = 0.015
    o.location = loc; o.scale = (scale, scale, scale)
    o.rotation_euler = (random.uniform(0, math.pi), random.uniform(0, math.pi), random.uniform(0, math.pi))
    o.data.materials.append(mat)

N_SHARDS = 66
for _ in range(N_SHARDS):
    hx, hy = random.choice(homes)
    zr = random.random()
    z = BOT + (TOP - BOT) * (1.0 - (0.4 * math.sqrt(zr) + 0.6 * zr))  # bottom-dense
    # round the column: narrow toward top & bottom
    maxr = 1.02 * math.sqrt(max(0.0, 1.0 - (z / 1.5) ** 2))
    fx, fy = hx, hy
    if math.hypot(hx, hy) > maxr + 0.15:
        fx *= 0.55; fy *= 0.55
    sb = max(0.0, 0.5 - 0.5 * (z / 1.4))            # larger toward top
    scale = random.uniform(0.06, 0.13) + 0.10 * sb
    make_shard((fx + random.uniform(-0.05, 0.05), fy + random.uniform(-0.05, 0.05), z),
               scale, random.choice(MAT_GLASS))

# ---- world: BRIGHT soft studio so the glass refracts light & sparkles ----
world = bpy.data.worlds.new('W'); scene.world = world; world.use_nodes = True
wn = world.node_tree
bgn = wn.nodes['Background']
# gradient-ish: use a light path? keep simple — bright cool white
bgn.inputs['Color'].default_value = (0.62, 0.70, 0.80, 1.0)
bgn.inputs['Strength'].default_value = 2.4

# strong key from upper-right-front for bright refractive glints
key = bpy.data.lights.new('key', 'AREA'); key.energy = 2400; key.size = 4.0
ko = bpy.data.objects.new('key', key); scene.collection.objects.link(ko)
ko.location = (3.2, -3.4, 3.4); ko.rotation_euler = (math.radians(55), 0, math.radians(40))
# warm-neutral fill low-left behind to light the accumulation
fill = bpy.data.lights.new('fill', 'AREA'); fill.energy = 1200; fill.size = 5.0
fo = bpy.data.objects.new('fill', fill); scene.collection.objects.link(fo)
fo.location = (-2.6, 3.0, -1.4); fo.rotation_euler = (math.radians(-42), 0, math.radians(-34))

# ---- camera: front-on along +Y, framed with margin ----
cam = bpy.data.cameras.new('cam'); co = bpy.data.objects.new('cam', cam)
scene.collection.objects.link(co); scene.camera = co
cam.type = 'PERSP'; cam.lens = 95
co.location = (0.0, -11.2, 0.0); co.rotation_euler = (math.radians(90), 0, 0)

out = os.path.abspath(os.path.join(os.path.dirname(__file__), 'glass_weave.png'))
scene.render.filepath = out
print("[glass_weave] rendering ->", out)
bpy.ops.render.render(write_still=True)
print("[glass_weave] done")
