"""
glass_debris.py — photoreal scattered glass shards adrift in space, for LOOM's
empty-state hero (owner 2026-07-04: 太空陨石碎片一样，玻璃碎片零散漂浮; 需要大改 →
switch from procedural to a rendered asset).

Real glass BSDF (transmission, IOR ~1.45) + a soft-box for mirror reflections +
a strong key for specular glints + REAL depth-of-field (near shards sharp, far
soft). Transparent film → drops onto the app's dark glass. Near-white / clear,
sophisticated, not a cyan glow.

Axes: X horizontal, Y depth (toward cam), Z vertical.
Run: Blender --background --python design/blender/glass_debris.py
Out: design/blender/glass_debris.png (RGBA)
"""
import bpy, bmesh, math, random, os

random.seed(20260705)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

scene.render.engine = 'CYCLES'
scene.cycles.samples = 460
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 32
scene.cycles.transmission_bounces = 24
scene.cycles.transparent_max_bounces = 32
scene.cycles.blur_glossy = 0.5
scene.render.film_transparent = True
scene.render.resolution_x = 1200
scene.render.resolution_y = 1200
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
    print("[debris] GPU (Metal)")
except Exception as e:
    scene.cycles.device = 'CPU'; print("[debris] CPU:", e)

# ---- materials ----
def glass_mat(name, tint, rough):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    g = nt.nodes.new('ShaderNodeBsdfGlass')
    g.inputs['Color'].default_value = (*tint, 1.0)
    g.inputs['Roughness'].default_value = rough
    g.inputs['IOR'].default_value = 1.46
    nt.links.new(g.outputs['BSDF'], out.inputs['Surface'])
    return m

MAT = [glass_mat('g0', (0.985, 0.99, 1.0), 0.0),
       glass_mat('g1', (0.88, 0.95, 1.0), 0.02),
       glass_mat('g2', (0.97, 0.99, 1.0), 0.01),
       glass_mat('g3', (0.90, 0.97, 1.0), 0.04)]

# ---- a scattered cloud of broken glass shards ----
def make_shard(loc, scale, mat):
    bm = bmesh.new()
    n = random.randint(3, 5)
    a0 = random.uniform(0, 2 * math.pi)
    vs = []
    for k in range(n):
        ang = a0 + (k / n) * 2 * math.pi + random.uniform(-0.55, 0.55)
        rad = random.uniform(0.45, 1.0)
        vs.append(bm.verts.new((math.cos(ang) * rad, 0.0, math.sin(ang) * rad)))
    try:
        bm.faces.new(vs)
    except Exception:
        pass
    me = bpy.data.meshes.new('shard'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('shard', me); bpy.context.collection.objects.link(o)
    o.modifiers.new('sol', 'SOLIDIFY').thickness = random.uniform(0.01, 0.03)
    bev = o.modifiers.new('bev', 'BEVEL'); bev.width = 0.004; bev.segments = 2
    o.location = loc; o.scale = (scale, scale, scale)
    o.rotation_euler = (random.uniform(0, math.pi), random.uniform(0, math.pi), random.uniform(0, math.pi))
    o.data.materials.append(mat)

N = 46
for _ in range(N):
    # scattered in an ellipsoid cloud (denser centre), spread in depth for DOF
    r = random.random() ** 0.5
    a = random.uniform(0, 2 * math.pi)
    x = math.cos(a) * r * 1.35
    z = math.sin(a) * r * 1.2
    y = random.uniform(-1.4, 1.4)                 # depth spread → some near, some far
    # a couple of larger hero shards, many small chips
    big = random.random() < 0.22
    scale = random.uniform(0.20, 0.36) if big else random.uniform(0.06, 0.15)
    make_shard((x, y, z), scale, random.choice(MAT))

# ---- world: a GRADIENT studio (bright above -> dark below) so the glass
#      refracts real light->dark variation and reads as dimensional glass,
#      not flat white or flat black. ----
world = bpy.data.worlds.new('W'); scene.world = world; world.use_nodes = True
wn = world.node_tree
bg = wn.nodes['Background']
geo = wn.nodes.new('ShaderNodeNewGeometry')
sep = wn.nodes.new('ShaderNodeSeparateXYZ')
ramp = wn.nodes.new('ShaderNodeValToRGB')
wn.links.new(geo.outputs['Incoming'], sep.inputs['Vector'])
wn.links.new(sep.outputs['Z'], ramp.inputs['Fac'])
e = ramp.color_ramp.elements
e[0].position = 0.34; e[0].color = (0.03, 0.04, 0.06, 1.0)   # lower hemisphere: dark
e[1].position = 0.64; e[1].color = (0.90, 0.94, 1.0, 1.0)    # upper: bright window
wn.links.new(ramp.outputs['Color'], bg.inputs['Color'])
bg.inputs['Strength'].default_value = 1.7

# soft-box overhead-front — the bright shape the glass MIRRORS (reflection streaks)
soft = bpy.data.lights.new('soft', 'AREA'); soft.energy = 1600; soft.size = 6.0
so = bpy.data.objects.new('soft', soft); scene.collection.objects.link(so)
so.location = (-1.5, -4.0, 4.2); so.rotation_euler = (math.radians(52), 0, math.radians(-20))
# sharp key from upper-right for pin specular glints
key = bpy.data.lights.new('key', 'AREA'); key.energy = 2600; key.size = 0.8
ko = bpy.data.objects.new('key', key); scene.collection.objects.link(ko)
ko.location = (3.4, -3.0, 3.0); ko.rotation_euler = (math.radians(58), 0, math.radians(46))
# cool rim from behind-below
rim = bpy.data.lights.new('rim', 'AREA'); rim.energy = 700; rim.size = 5.0
ro = bpy.data.objects.new('rim', rim); scene.collection.objects.link(ro)
ro.location = (-2.2, 3.2, -1.8); ro.rotation_euler = (math.radians(-44), 0, math.radians(-30))

# ---- camera with REAL depth of field ----
cam = bpy.data.cameras.new('cam'); co = bpy.data.objects.new('cam', cam)
scene.collection.objects.link(co); scene.camera = co
cam.type = 'PERSP'; cam.lens = 90
co.location = (0.0, -9.5, 0.0); co.rotation_euler = (math.radians(90), 0, 0)
cam.dof.use_dof = True
cam.dof.focus_distance = 9.4          # focus the near-centre cluster
cam.dof.aperture_fstop = 2.4          # shallow → soft far/near debris

out = os.path.abspath(os.path.join(os.path.dirname(__file__), 'glass_debris.png'))
scene.render.filepath = out
print("[debris] rendering ->", out)
bpy.ops.render.render(write_still=True)
print("[debris] done")
