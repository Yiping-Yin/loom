# The BRIGHT full moon (owner comp 2026-07-04): a front-lit frosted
# sphere with heavy crater relief, rim-lit from behind, rendered on a
# transparent background. Post pass adds the halo glow and light pool.
import bpy
import math
import sys

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "/tmp/moon_bright.png"
SAMPLES = int(argv[1]) if len(argv) > 1 else 200
RES = int(argv[2]) if len(argv) > 2 else 1024

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

# ---- the moon: frosted regolith sphere with crater relief
bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64, radius=0.62,
                                     location=(0, 0, 0))
moon = bpy.context.object
moon.name = "moon"
bpy.ops.object.shade_smooth()

mat = bpy.data.materials.new("regolith")
mat.use_nodes = True
nt = mat.node_tree
b = nt.nodes["Principled BSDF"]
def set_in(node, name, value):
    if name in node.inputs:
        node.inputs[name].default_value = value
set_in(b, "Base Color", (0.72, 0.735, 0.76, 1))
set_in(b, "Roughness", 0.86)

# crater relief: three voronoi scales, each shaped through a CRATER
# PROFILE ramp (pit floor -> rim ridge -> flat plain), summed into bump.
tex = nt.nodes.new("ShaderNodeTexCoord")

def crater_layer(scale, pit, rim_pos, weight):
    v = nt.nodes.new("ShaderNodeTexVoronoi")
    v.feature = 'SMOOTH_F1'
    v.inputs["Scale"].default_value = scale
    if "Smoothness" in v.inputs:
        v.inputs["Smoothness"].default_value = 0.25
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    els = ramp.color_ramp.elements
    els[0].position = 0.0
    els[0].color = (pit, pit, pit, 1)          # pit floor (low)
    els[1].position = rim_pos
    els[1].color = (1.0, 1.0, 1.0, 1)          # rim ridge (high)
    mid = ramp.color_ramp.elements.new(min(rim_pos + 0.18, 0.98))
    mid.color = (0.55, 0.55, 0.55, 1)          # settle to plain
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = 'MULTIPLY'
    mul.inputs[1].default_value = weight
    nt.links.new(tex.outputs["Object"], v.inputs["Vector"])
    nt.links.new(v.outputs["Distance"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], mul.inputs[0])
    return mul

l1 = crater_layer(3.6, 0.18, 0.34, 0.9)    # large basins
l2 = crater_layer(9.0, 0.22, 0.30, 0.55)   # medium craters
l3 = crater_layer(22.0, 0.25, 0.28, 0.30)  # small pocks
noise = nt.nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 55.0
noise.inputs["Detail"].default_value = 8.0
nmul = nt.nodes.new("ShaderNodeMath")
nmul.operation = 'MULTIPLY'
nmul.inputs[1].default_value = 0.16
nt.links.new(tex.outputs["Object"], noise.inputs["Vector"])
nt.links.new(noise.outputs["Fac"], nmul.inputs[0])

a1 = nt.nodes.new("ShaderNodeMath"); a1.operation = 'ADD'
a2 = nt.nodes.new("ShaderNodeMath"); a2.operation = 'ADD'
a3 = nt.nodes.new("ShaderNodeMath"); a3.operation = 'ADD'
nt.links.new(l1.outputs["Value"], a1.inputs[0])
nt.links.new(l2.outputs["Value"], a1.inputs[1])
nt.links.new(a1.outputs["Value"], a2.inputs[0])
nt.links.new(l3.outputs["Value"], a2.inputs[1])
nt.links.new(a2.outputs["Value"], a3.inputs[0])
nt.links.new(nmul.outputs["Value"], a3.inputs[1])

bump = nt.nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.85
bump.inputs["Distance"].default_value = 0.06
links = nt.links
links.new(a3.outputs["Value"], bump.inputs["Height"])
links.new(bump.outputs["Normal"], b.inputs["Normal"])

# maria: darker albedo patches via large-scale noise mixed into base color
mnoise = nt.nodes.new("ShaderNodeTexNoise")
mnoise.inputs["Scale"].default_value = 2.2
mnoise.inputs["Detail"].default_value = 3.0
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].position = 0.40
ramp.color_ramp.elements[0].color = (0.46, 0.49, 0.535, 1)
ramp.color_ramp.elements[1].position = 0.62
ramp.color_ramp.elements[1].color = (0.74, 0.755, 0.78, 1)
links.new(tex.outputs["Object"], mnoise.inputs["Vector"])
links.new(mnoise.outputs["Fac"], ramp.inputs["Fac"])
links.new(ramp.outputs["Color"], b.inputs["Base Color"])
moon.data.materials.append(mat)

# ---- full-moon key: sun along the camera axis (slightly high-left)
sun_data = bpy.data.lights.new("sun", type='SUN')
sun_data.energy = 3.6
sun_data.angle = math.radians(4)
sun_data.color = (1.0, 0.995, 0.985)
sun = bpy.data.objects.new("sun", sun_data)
sun.rotation_euler = (math.radians(80), math.radians(-8), math.radians(-6))
scene.collection.objects.link(sun)

# ---- rim: disk backlight just behind the sphere for the limb blaze
rim_data = bpy.data.lights.new("rim", type='AREA')
rim_data.shape = 'DISK'
rim_data.size = 2.5
rim_data.energy = 260.0
rim_data.color = (1.0, 0.99, 0.97)
rim = bpy.data.objects.new("rim", rim_data)
rim.location = (0.0, 1.35, 0.0)
rim.rotation_euler = (-math.pi / 2, 0, 0)
scene.collection.objects.link(rim)

bpy.ops.render.render(write_still=True)
print("RENDER_DONE", OUT)
