# The REAL moon (owner verdict 2026-07-04: procedural craters read as a
# golf ball). NASA CGI Moon Kit data — LRO color albedo + LDEM elevation,
# public domain — on a displaced sphere, lit for the comp's luminous
# full-moon look: soft key just off the camera axis, disk rim backlight,
# transparent film. Textures are NOT committed; download via:
#   curl -O https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_4k.tif
#   curl -O https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16_uint.tif
import bpy
import math
import sys
import os

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "/tmp/moon_nasa.png"
TEXDIR = argv[1] if len(argv) > 1 else "."
SAMPLES = int(argv[2]) if len(argv) > 2 else 220
RES = int(argv[3]) if len(argv) > 3 else 1200
ROT_Z = math.radians(float(argv[4])) if len(argv) > 4 else 0.0

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.render.resolution_x = RES
scene.render.resolution_y = RES
scene.render.filepath = OUT
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = True
try:
    scene.cycles.device = 'GPU'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
except Exception:
    pass

# ---- camera, facing -Y
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 70
cam = bpy.data.objects.new("cam", cam_data)
cam.location = (0.0, -3.2, 0.0)
cam.rotation_euler = (math.pi / 2, 0.0, 0.0)
scene.collection.objects.link(cam)
scene.camera = cam

# ---- the moon: NASA-textured displaced sphere
bpy.ops.mesh.primitive_uv_sphere_add(segments=256, ring_count=128, radius=0.62,
                                     location=(0, 0, 0))
moon = bpy.context.object
moon.name = "moon"
moon.rotation_euler = (0, 0, ROT_Z)
bpy.ops.object.shade_smooth()
subsurf = moon.modifiers.new("subsurf", 'SUBSURF')
subsurf.subdivision_type = 'SIMPLE'
subsurf.render_levels = 3
subsurf.levels = 1

mat = bpy.data.materials.new("lunar")
mat.use_nodes = True
try:
    mat.cycles.displacement_method = 'BOTH'
except Exception:
    pass
nt = mat.node_tree
b = nt.nodes["Principled BSDF"]
def set_in(node, name, value):
    if name in node.inputs:
        node.inputs[name].default_value = value
set_in(b, "Roughness", 0.92)

color_img = bpy.data.images.load(os.path.join(TEXDIR, "color_4k.tif"))
ldem_img = bpy.data.images.load(os.path.join(TEXDIR, "ldem_16.tif"))
ldem_img.colorspace_settings.name = 'Non-Color'

color_tex = nt.nodes.new("ShaderNodeTexImage")
color_tex.image = color_img
ldem_tex = nt.nodes.new("ShaderNodeTexImage")
ldem_tex.image = ldem_img

# gentle brightness shaping toward the comp's luminous frost
gamma = nt.nodes.new("ShaderNodeGamma")
gamma.inputs["Gamma"].default_value = 0.85
bright = nt.nodes.new("ShaderNodeBrightContrast")
bright.inputs["Bright"].default_value = 0.10
bright.inputs["Contrast"].default_value = 0.04

disp = nt.nodes.new("ShaderNodeDisplacement")
disp.inputs["Scale"].default_value = 0.032
disp.inputs["Midlevel"].default_value = 0.5

out = nt.nodes["Material Output"]
links = nt.links
links.new(color_tex.outputs["Color"], gamma.inputs["Color"])
links.new(gamma.outputs["Color"], bright.inputs["Color"])
links.new(bright.outputs["Color"], b.inputs["Base Color"])
links.new(ldem_tex.outputs["Color"], disp.inputs["Height"])
links.new(disp.outputs["Displacement"], out.inputs["Displacement"])
moon.data.materials.append(mat)

# ---- key: sun a touch off the camera axis (relief shading, full face lit)
sun_data = bpy.data.lights.new("sun", type='SUN')
sun_data.energy = 4.2
sun_data.angle = math.radians(2)
sun_data.color = (1.0, 0.995, 0.985)
sun = bpy.data.objects.new("sun", sun_data)
sun.rotation_euler = (math.radians(75), math.radians(-10), math.radians(-14))
scene.collection.objects.link(sun)

# ---- rim: disk backlight for the limb blaze
rim_data = bpy.data.lights.new("rim", type='AREA')
rim_data.shape = 'DISK'
rim_data.size = 2.4
rim_data.energy = 240.0
rim_data.color = (1.0, 0.99, 0.97)
rim = bpy.data.objects.new("rim", rim_data)
rim.location = (0.0, 1.3, 0.0)
rim.rotation_euler = (-math.pi / 2, 0, 0)
scene.collection.objects.link(rim)

bpy.ops.render.render(write_still=True)
print("RENDER_DONE", OUT)
