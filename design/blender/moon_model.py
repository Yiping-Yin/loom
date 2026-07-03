# Carved-glass moon — Blender headless scene (Cycles, real glass optics).
# Composition: a thin glass slab facing the camera; behind it a frosted
# moon disc with crater relief (bump from procedural voronoi+noise); an
# area light BEHIND the disc so the limb blazes and light pools through;
# a dark floor below to receive the caustic; black world.
import bpy
import math
import sys

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "/tmp/moon_render.png"
SAMPLES = int(argv[1]) if len(argv) > 1 else 160
RES = int(argv[2]) if len(argv) > 2 else 768

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.render.resolution_x = RES
scene.render.resolution_y = RES
scene.render.filepath = OUT
scene.render.image_settings.file_format = 'PNG'
try:
    scene.cycles.device = 'GPU'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
except Exception:
    pass

# ---- world: near-black
world = bpy.data.worlds.new("world")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.008, 0.010, 0.013, 1.0)
bg.inputs[1].default_value = 1.0
scene.world = world

# ---- camera, facing -Y
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 65
cam = bpy.data.objects.new("cam", cam_data)
cam.location = (0.0, -3.4, 0.05)
cam.rotation_euler = (math.pi / 2, 0.0, 0.0)
scene.collection.objects.link(cam)
scene.camera = cam

# ---- glass slab (front pane the moon lives behind)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
slab = bpy.context.object
slab.name = "slab"
slab.scale = (1.5, 0.05, 1.5)
glass = bpy.data.materials.new("glass")
glass.use_nodes = True
gb = glass.node_tree.nodes["Principled BSDF"]
def set_in(node, name, value):
    if name in node.inputs:
        node.inputs[name].default_value = value
set_in(gb, "Transmission Weight", 1.0)
set_in(gb, "Transmission", 1.0)  # older naming fallback
set_in(gb, "Roughness", 0.03)
set_in(gb, "IOR", 1.5)
set_in(gb, "Base Color", (1, 1, 1, 1))
slab.data.materials.append(glass)
try:
    slab.is_caustics_caster = True
except Exception:
    pass

# ---- moon disc: frosted glass with crater bump, just behind the slab
bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=0.62, depth=0.06,
                                    location=(0, 0.22, 0.02),
                                    rotation=(math.pi / 2, 0, 0))
moon = bpy.context.object
moon.name = "moon"
bpy.ops.object.shade_smooth()
frost = bpy.data.materials.new("frost")
frost.use_nodes = True
nt = frost.node_tree
fb = nt.nodes["Principled BSDF"]
set_in(fb, "Transmission Weight", 0.18)
set_in(fb, "Transmission", 0.18)
set_in(fb, "Roughness", 0.55)          # frosted, near-dark: the night side
set_in(fb, "IOR", 1.45)
set_in(fb, "Base Color", (0.065, 0.068, 0.075, 1))

# crater relief: voronoi pits + fine noise -> bump
tex_coord = nt.nodes.new("ShaderNodeTexCoord")
voro = nt.nodes.new("ShaderNodeTexVoronoi")
voro.feature = 'SMOOTH_F1'
voro.inputs["Scale"].default_value = 14.0
if "Smoothness" in voro.inputs:
    voro.inputs["Smoothness"].default_value = 0.35
noise = nt.nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 48.0
noise.inputs["Detail"].default_value = 6.0
mixv = nt.nodes.new("ShaderNodeMath")
mixv.operation = 'MULTIPLY_ADD'
bump = nt.nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 1.15
bump.inputs["Distance"].default_value = 0.06
links = nt.links
links.new(tex_coord.outputs["Object"], voro.inputs["Vector"])
links.new(tex_coord.outputs["Object"], noise.inputs["Vector"])
links.new(voro.outputs["Distance"], mixv.inputs[0])
mixv.inputs[1].default_value = 0.75
links.new(noise.outputs["Fac"], mixv.inputs[2])
links.new(mixv.outputs["Value"], bump.inputs["Height"])
links.new(bump.outputs["Normal"], fb.inputs["Normal"])
moon.data.materials.append(frost)
try:
    moon.is_caustics_caster = True
except Exception:
    pass

# ---- the backlight: area light hidden directly behind the moon
light_data = bpy.data.lights.new("back", type='AREA')
light_data.energy = 285.0
light_data.shape = 'DISK'
light_data.size = 1.52
light_data.color = (1.0, 0.985, 0.96)
try:
    light_data.use_shadow_caustics = True
except Exception:
    pass
light = bpy.data.objects.new("back", light_data)
light.location = (0.015, 0.66, 0.045)
light.rotation_euler = (-math.pi / 2, 0, 0)
scene.collection.objects.link(light)

# faint cool front fill so the slab face reads
fill_data = bpy.data.lights.new("fill", type='AREA')
fill_data.energy = 42.0
fill_data.size = 3.0
fill_data.color = (0.85, 0.92, 1.0)
fill = bpy.data.objects.new("fill", fill_data)
fill.location = (-2.2, -1.8, 1.8)
fill.rotation_euler = (math.radians(65), 0, math.radians(-30))
scene.collection.objects.link(fill)

# ---- dark floor to receive the caustic pool
bpy.ops.mesh.primitive_plane_add(size=8.0, location=(0, 0, -0.92))
floor = bpy.context.object
floor.name = "floor"
dark = bpy.data.materials.new("dark")
dark.use_nodes = True
db = dark.node_tree.nodes["Principled BSDF"]
set_in(db, "Base Color", (0.015, 0.017, 0.020, 1))
set_in(db, "Roughness", 0.35)
floor.data.materials.append(dark)
try:
    floor.is_caustics_receiver = True
except Exception:
    pass

bpy.ops.render.render(write_still=True)
print("RENDER_DONE", OUT)
