using System;
using System.Collections.Generic;
using System.Text;
using System.Web;

namespace ConsoleApplication2
{
    class hydra_test
    {
        static void Main(string[] args)
        {
            Console.Write("test");
            HYDRA_LOCAL.AuthenticationService hd = new HYDRA_LOCAL.AuthenticationService();
            HYDRA_LOCAL.login l = new HYDRA_LOCAL.login();
            l.username = "root";
            l.password = "";
            HYDRA_LOCAL.loginResponse session = hd.login(l);
            Console.Write(session.loginResult);

            HYDRA_LOCAL.RequestHeader header = new HYDRA_LOCAL.RequestHeader();
            header.session_id = session.loginResult;
            header.username = l.username;

            hd.RequestHeaderValue = header;

            hydra_test p = new hydra_test();

            p.add_network(hd);

            Console.Read();
        }

        public void add_network(HYDRA_LOCAL.AuthenticationService hd){

            HYDRA_LOCAL.Project proj = new HYDRA_LOCAL.Project();
            proj.name = "Windows project";
            proj.description = "Project created by windows";

            HYDRA_LOCAL.add_project add_proj = new HYDRA_LOCAL.add_project();
            add_proj.project = proj;
            HYDRA_LOCAL.add_projectResponse p = hd.add_project(add_proj);

            HYDRA_LOCAL.Attr[] attrs = new HYDRA_LOCAL.Attr[3];

            attrs[0] = create_attr(hd, "windows attribute 1");
            attrs[1] = create_attr(hd, "windows attribute 2");
            attrs[2] = create_attr(hd, "windows attribute 3");


            HYDRA_LOCAL.Network net = new HYDRA_LOCAL.Network();
            net.project_id  = p.add_projectResult.id;
            net.name        = "Test Windows Network";
            net.description = "A network build on windows";

            HYDRA_LOCAL.Node[] nodes = new HYDRA_LOCAL.Node[3];
            HYDRA_LOCAL.Link[] links = new HYDRA_LOCAL.Link[2];

            nodes[0] = create_node("-1", "node A", "windows node 1", (decimal)0.1, (decimal)0.1, attrs);
            nodes[1] = create_node("-2", "node B", "windows node 2", (decimal)0.2, (decimal)0.2, new HYDRA_LOCAL.Attr[0]);
            nodes[2] = create_node("-3", "node C", "windows node 3", (decimal)0.3, (decimal)0.3, new HYDRA_LOCAL.Attr[0]);

            HYDRA_LOCAL.ResourceScenario[] data = new HYDRA_LOCAL.ResourceScenario[3];
            data[0] = create_descriptor(nodes[0].attributes[0]);
            data[1] = create_array(nodes[0].attributes[1]);
            data[2] = create_timeseries(nodes[0].attributes[2]);

            links[0] = create_link("link X", "link A to B", nodes[0].id, nodes[1].id, new HYDRA_LOCAL.Attr[0]);
            links[1] = create_link("link Y", "link B to C", nodes[1].id, nodes[2].id, new HYDRA_LOCAL.Attr[0]);

            net.nodes = nodes;
            net.links = links;

            HYDRA_LOCAL.Scenario scenario = create_scenario("Windows scenario!", data);
            net.scenarios = new HYDRA_LOCAL.Scenario[] { scenario };

            HYDRA_LOCAL.add_network add_net = new HYDRA_LOCAL.add_network();
            HYDRA_LOCAL.get_node_data();
            add_net.network = net;

            HYDRA_LOCAL.add_networkResponse n = hd.add_network(add_net);
            
            Console.Write("ID of new network is: " + n.add_networkResult.id);
        }

        private HYDRA_LOCAL.Scenario create_scenario(string name, HYDRA_LOCAL.ResourceScenario[] rs)
        {
            HYDRA_LOCAL.Scenario scenario = new HYDRA_LOCAL.Scenario();
            scenario.id = "-1";
            scenario.name = name;
            scenario.description = "A scenario created on windows";
            scenario.resourcescenarios = rs;

            return scenario;
        
        }

        private HYDRA_LOCAL.Attr create_attr(HYDRA_LOCAL.AuthenticationService hd, string name)
        {
            HYDRA_LOCAL.get_attribute get_attr = new HYDRA_LOCAL.get_attribute();
            get_attr.name = name;
            HYDRA_LOCAL.get_attributeResponse attr_resp = hd.get_attribute(get_attr);

            HYDRA_LOCAL.Attr attr = new HYDRA_LOCAL.Attr();
            if (attr_resp.get_attributeResult != null)
            {
                attr.dimen = attr_resp.get_attributeResult.dimen;
                attr.id = attr_resp.get_attributeResult.id;
                attr.name = attr_resp.get_attributeResult.name;
            }
            else
            {
                attr.dimen = "really big";
                attr.name = name;
                HYDRA_LOCAL.add_attribute add_attr_wrapper = new HYDRA_LOCAL.add_attribute();
                add_attr_wrapper.attr = attr;
                HYDRA_LOCAL.add_attributeResponse add_attr_resp = hd.add_attribute(add_attr_wrapper);
                attr.id = add_attr_resp.add_attributeResult.id;
            }
            return attr;
        }

        private HYDRA_LOCAL.Node create_node(String id, String name, String desc, Decimal x, Decimal y, HYDRA_LOCAL.Attr[] attrs)
        {
            HYDRA_LOCAL.Node node  = new HYDRA_LOCAL.Node();
            node.id          = id;
            node.name        = name;
            node.description = desc;
            node.x           = x;
            node.y           = y;

            if (attrs != null)
            {
                HYDRA_LOCAL.ResourceAttr[] ras = new HYDRA_LOCAL.ResourceAttr[attrs.Length];
                for (int i=0; i<attrs.Length; i++){

                    HYDRA_LOCAL.Attr attr = attrs[i];
                    HYDRA_LOCAL.ResourceAttr ra = new HYDRA_LOCAL.ResourceAttr();
                    int ra_id = (i + 1) * -1;
                    ra.id = ra_id.ToString();
                    ra.attr_id = attr.id;
                    ras[i] = ra;
                }
                node.attributes = ras;
            }

            return node;
        }

        private HYDRA_LOCAL.Link create_link(String name, String desc, String node_a_id, String node_b_id, HYDRA_LOCAL.Attr[] attrs)
        {
            HYDRA_LOCAL.Link link  = new HYDRA_LOCAL.Link();
            link.name        = name;
            link.description = desc;
            link.node_1_id   = node_a_id;
            link.node_2_id   = node_b_id;

            return link;
        }

        private HYDRA_LOCAL.ResourceScenario create_descriptor(HYDRA_LOCAL.ResourceAttr ra)
        {
            HYDRA_LOCAL.Descriptor val = new HYDRA_LOCAL.Descriptor();
            val.desc_val = "I am a windows descriptor";

            HYDRA_LOCAL.Dataset dataset = new HYDRA_LOCAL.Dataset();
            dataset.value = val;

            dataset.unit = "string";
            dataset.name = "Description of a windows descriptor";
            dataset.type = "descriptor";
            dataset.dimension = "really big";

            HYDRA_LOCAL.ResourceScenario rs = new HYDRA_LOCAL.ResourceScenario();
            rs.attr_id = ra.attr_id;
            rs.resource_attr_id = ra.id;
            rs.value = dataset;

            return rs;
        }

        private HYDRA_LOCAL.ResourceScenario create_array(HYDRA_LOCAL.ResourceAttr ra)
        {
            HYDRA_LOCAL.Array val = new HYDRA_LOCAL.Array();
            object a;
            a = 1;
            val.arr_data = a;// "[[[1, 2, 3], [5, 4, 6]],[[10, 20, 30], [40, 50, 60]]]";

            HYDRA_LOCAL.Dataset dataset = new HYDRA_LOCAL.Dataset();
            dataset.value = val;

            dataset.unit = "metres";
            dataset.name = "A windows generated array";
            dataset.type = "array";
            dataset.dimension = "2d matrix";

            HYDRA_LOCAL.ResourceScenario rs = new HYDRA_LOCAL.ResourceScenario();
            rs.attr_id = ra.attr_id;
            rs.resource_attr_id = ra.id;
            rs.value = dataset;
            return rs;
        }

        private HYDRA_LOCAL.ResourceScenario create_timeseries(HYDRA_LOCAL.ResourceAttr ra)
        {
            string format = "yyyy-MM-dd hh:mm:ss.0";
            HYDRA_LOCAL.TimeSeriesData val_1 = new HYDRA_LOCAL.TimeSeriesData();
            val_1.ts_value = "[1, 2, 3]";
            val_1.ts_time = DateTime.Now.ToString(format);

            HYDRA_LOCAL.TimeSeriesData val_2 = new HYDRA_LOCAL.TimeSeriesData();
            val_2.ts_value = "[10, 20, 30]";
            val_2.ts_time = DateTime.Now.ToString(format);

            HYDRA_LOCAL.TimeSeries ts = new HYDRA_LOCAL.TimeSeries();
            ts.ts_values = new HYDRA_LOCAL.TimeSeriesData[] { val_1, val_2 };

            HYDRA_LOCAL.Dataset dataset = new HYDRA_LOCAL.Dataset();
            dataset.value = ts;

            dataset.unit = "m3";
            dataset.name = "A windows time series";
            dataset.type = "timeseries";
            dataset.dimension = "volume";

            HYDRA_LOCAL.ResourceScenario rs = new HYDRA_LOCAL.ResourceScenario();
            rs.attr_id = ra.attr_id;
            rs.resource_attr_id = ra.id;
            rs.value = dataset;

            return rs;
        }
    }
}
